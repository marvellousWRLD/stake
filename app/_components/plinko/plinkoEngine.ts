
import Matter, { IBodyDefinition } from "matter-js";
import { binPayouts, getRandomBetween, RiskLevel, RowCount } from "./utils";
import { usePlinkoStore } from "../../_store/plinkoStore";
import { useAuthStore } from "@/app/_store/commonStore";  // add this at top of file

type BallFrictionsByRowCount = {
  friction: NonNullable<IBodyDefinition["friction"]>;
  frictionAirByRowCount: Record<
    RowCount,
    NonNullable<IBodyDefinition["frictionAir"]>
  >;
};

/**
 * Engine for rendering the Plinko game using [matter-js](https://brm.io/matter-js/).
 *
 * The engine will read/write data to Svelte stores during game state changes.
 */
class PlinkoEngine {
  /**
   * The canvas element to render the game to.
   */
  private canvas: HTMLCanvasElement;

  /**
   * A cache value of the {@link betAmount} store for faster access.
   */
  private betAmount: number;
  /**
   * A cache value of the {@link rowCount} store for faster access.
   */
  private rowCount: RowCount;
  /**
   * A cache value of the {@link riskLevel} store for faster access.
   */
  private riskLevel: RiskLevel;

  private engine: Matter.Engine;
  private render: Matter.Render;
  private runner: Matter.Runner;

  /**
   * Every pin of the game.
   */
  private pins: Matter.Body[] = [];
  /**
   * Walls are invisible, slanted "guard rails" at the left and right sides of the
   * pin triangle. It prevents balls from falling outside the pin triangle and not
   * hitting a bin.
   */
  private walls: Matter.Body[] = [];
  /**
   * "Sensor" is an invisible body at the bottom of the canvas. It detects whether
   * a ball arrives at the bottom and enters a bin.
   */
  private sensor: Matter.Body;

  /**
   * The x-coordinates of every pin's center in the last row. Useful for calculating
   * which bin a ball falls into.
   */
  private pinsLastRowXCoords: number[] = [];

  static WIDTH = 760;
  static HEIGHT = 570;
  private static multiplier = 1;

  private static PADDING_X = 52;
  private static PADDING_TOP = 36;
  private static PADDING_BOTTOM = 28;

  private static PIN_CATEGORY = 0x0001;
  private static BALL_CATEGORY = 0x0002;

  /**
   * Friction parameters to be applied to the ball body.
   *
   * Higher friction leads to more concentrated distribution towards the center. These numbers
   * are found by trial and error to make the actual weighted bin payout very close to the
   * expected bin payout.
   */
  private static ballFrictions: BallFrictionsByRowCount = {
    friction: 0.5,
    frictionAirByRowCount: {
      8: 0.0395,
      9: 0.041,
      10: 0.038,
      11: 0.0355,
      12: 0.0414,
      13: 0.0437,
      14: 0.0401,
      15: 0.0418,
      16: 0.0364,
    },
  };

  private store = usePlinkoStore.getState();

  /**
   * Creates the engine and the game's layout.
   *
   * @param canvas The canvas element to render the game to.
   *
   * @remarks This constructor does NOT start the rendering and physics engine.
   * Call the `start` method to start the engine.
   */
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    this.betAmount = this.store.betAmount;
    this.rowCount = this.store.rowCount;
    this.riskLevel = this.store.riskLevel;


    // Subscribe to store updates
    usePlinkoStore.subscribe((state) => {
      this.betAmount = state.betAmount;
      if (state.rowCount !== this.rowCount) {
        this.updateRowCount(state.rowCount);
      }
      this.riskLevel = state.riskLevel;
    });

    this.engine = Matter.Engine.create({
      timing: {
        timeScale: 1,
      },
    });
    this.render = Matter.Render.create({
      engine: this.engine,
      canvas: this.canvas,
      options: {
        width: PlinkoEngine.WIDTH,
        height: PlinkoEngine.HEIGHT,
        background: "#0f1923",
        wireframes: false,
      },
    });
    this.runner = Matter.Runner.create();

    this.placePinsAndWalls();

    this.sensor = Matter.Bodies.rectangle(
      this.canvas.width / 2,
      this.canvas.height,
      this.canvas.width,
      10,
      {
        isSensor: true,
        isStatic: true,
        render: {
          visible: false,
        },
      }
    );
    Matter.Composite.add(this.engine.world, [this.sensor]);
    Matter.Events.on(this.engine, "collisionStart", ({ pairs }) => {
      pairs.forEach(({ bodyA, bodyB }) => {
        if (bodyA === this.sensor) {
          this.handleBallEnterBin(bodyB);
        } else if (bodyB === this.sensor) {
          this.handleBallEnterBin(bodyA);
        }
      });
    });
  }

  /**
   * Renders the game and starts the physics engine.
   */
  start() {
    Matter.Render.run(this.render); // Renders the scene to canvas
    Matter.Runner.run(this.runner, this.engine); // Starts the simulation in physics engine
  }

  /**
   * Stops (pauses) the rendering and physics engine.
   */
  stop() {
    Matter.Render.stop(this.render);
    Matter.Runner.stop(this.runner);
  }

  /**
   * Drops a new ball from the top with a random horizontal offset, and deducts the balance.
   */
  dropBall() {
    const ballOffsetRangeX = this.pinDistanceX * 0.8;
    const ballRadius = this.pinRadius * 2;
    const { friction, frictionAirByRowCount } = PlinkoEngine.ballFrictions;
    const ball = Matter.Bodies.circle(
      getRandomBetween(
        this.canvas.width / 2 - ballOffsetRangeX,
        this.canvas.width / 2 + ballOffsetRangeX
      ),
      0,
      ballRadius,
      {
        restitution: 0.8, // Bounciness
        friction,
        frictionAir: frictionAirByRowCount[this.rowCount],
        collisionFilter: {
          category: PlinkoEngine.BALL_CATEGORY,
          mask: PlinkoEngine.PIN_CATEGORY, // Collide with pins only, but not other balls
        },
        render: {
          fillStyle: "#ff0000",
        },
      }
    );
    Matter.Composite.add(this.engine.world, ball);

    // betAmountOfExistingBalls.update((value) => ({ ...value, [ball.id]: this.betAmount }));
    // balance.update((balance) => balance - this.betAmount);
  }

  /**
   * Total width of all bins as percentage of the canvas width.
   */
  get binsWidthPercentage(): number {
    const lastPinX =
      this.pinsLastRowXCoords[this.pinsLastRowXCoords.length - 1];
    return (lastPinX - this.pinsLastRowXCoords[0]) / PlinkoEngine.WIDTH;
  }

  /**
   * Gets the horizontal distance between each pin's center point.
   */
  private get pinDistanceX(): number {
    const lastRowPinCount = 3 + this.rowCount - 1;
    return (
      (this.canvas.width - PlinkoEngine.PADDING_X * 2) / (lastRowPinCount - 1)
    );
  }

  private get pinRadius(): number {
    return (24 - this.rowCount) / 2;
  }

  get rowCountOfEngine(): RowCount {
    return this.rowCount;
  }

  /**
   * Refreshes the game with a new number of rows.
   *
   * Does nothing if the new row count equals the current count.
   */
  updateRowCount(rowCount: RowCount) {
    if (rowCount === this.rowCount) {
      return;
    }

    this.removeAllBalls();

    this.rowCount = rowCount;
    this.placePinsAndWalls();
  }

  /**
   * Called when a ball hits the invisible sensor at the bottom.
   */
  private handleBallEnterBin(ball: Matter.Body) {
    const binIndex = this.pinsLastRowXCoords.findLastIndex(
      (pinX) => pinX < ball.position.x
    );
  
    if (binIndex !== -1 && binIndex < this.pinsLastRowXCoords.length - 1) {
      // 1️⃣ compute the payout multiplier
      const payoutMultiplier = binPayouts[this.rowCount][this.riskLevel][binIndex];
  
      // 2️⃣ show it in your UI
      this.store.setMultiplier(payoutMultiplier);
  
      // 3️⃣ credit payout on the server, then refresh authStore balance
      const { user, token, fetchUser } = useAuthStore.getState();
      if (user && token) {
        fetch("/api/plinko/payout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: user.username,
            betAmount: this.betAmount,
            payoutMultiplier,
          }),
        })
          .then((res) => {
            if (!res.ok) throw new Error("Payout failed");
            return fetchUser(token);
          })
          .catch((err) => console.error("Plinko payout error:", err));
      }
    }
  
    Matter.Composite.remove(this.engine.world, ball);
  }
  

  /**
   * Renders the pins and walls. Previous ones are removed before rendering new ones.
   */
  private placePinsAndWalls() {
    const {
      PADDING_X,
      PADDING_TOP,
      PADDING_BOTTOM,
      PIN_CATEGORY,
      BALL_CATEGORY,
    } = PlinkoEngine;

    if (this.pins.length > 0) {
      Matter.Composite.remove(this.engine.world, this.pins);
      this.pins = [];
    }
    if (this.pinsLastRowXCoords.length > 0) {
      this.pinsLastRowXCoords = [];
    }
    if (this.walls.length > 0) {
      Matter.Composite.remove(this.engine.world, this.walls);
      this.walls = [];
    }

    for (let row = 0; row < this.rowCount; ++row) {
      const rowY =
        PADDING_TOP +
        ((this.canvas.height - PADDING_TOP - PADDING_BOTTOM) /
          (this.rowCount - 1)) *
          row;

      /** Horizontal distance between canvas left/right boundary and first/last pin of the row. */
      const rowPaddingX =
        PADDING_X + ((this.rowCount - 1 - row) * this.pinDistanceX) / 2;

      for (let col = 0; col < 3 + row; ++col) {
        const colX =
          rowPaddingX +
          ((this.canvas.width - rowPaddingX * 2) / (3 + row - 1)) * col;
        const pin = Matter.Bodies.circle(colX, rowY, this.pinRadius, {
          isStatic: true,
          render: {
            fillStyle: "#ffffff",
          },
          collisionFilter: {
            category: PIN_CATEGORY,
            mask: BALL_CATEGORY, // Collide with balls
          },
        });
        this.pins.push(pin);

        if (row === this.rowCount - 1) {
          this.pinsLastRowXCoords.push(colX);
        }
      }
    }
    Matter.Composite.add(this.engine.world, this.pins);

    const firstPinX = this.pins[0].position.x;
    const leftWallAngle = Math.atan2(
      firstPinX - this.pinsLastRowXCoords[0],
      this.canvas.height - PADDING_TOP - PADDING_BOTTOM
    );
    const leftWallX =
      firstPinX -
      (firstPinX - this.pinsLastRowXCoords[0]) / 2 -
      this.pinDistanceX * 0.25;

    const leftWall = Matter.Bodies.rectangle(
      leftWallX,
      this.canvas.height / 2,
      10,
      this.canvas.height,
      {
        isStatic: true,
        angle: leftWallAngle,
        render: { visible: false },
      }
    );
    const rightWall = Matter.Bodies.rectangle(
      this.canvas.width - leftWallX,
      this.canvas.height / 2,
      10,
      this.canvas.height,
      {
        isStatic: true,
        angle: -leftWallAngle,
        render: { visible: false },
      }
    );
    this.walls.push(leftWall, rightWall);
    Matter.Composite.add(this.engine.world, this.walls);
  }

  private removeAllBalls() {
    Matter.Composite.allBodies(this.engine.world).forEach((body) => {
      if (body.collisionFilter.category === PlinkoEngine.BALL_CATEGORY) {
        Matter.Composite.remove(this.engine.world, body);
      }
    });
  }

  getMultipliers(): number[] {
    return binPayouts[this.rowCount][this.riskLevel];
  }
}

export default PlinkoEngine;
