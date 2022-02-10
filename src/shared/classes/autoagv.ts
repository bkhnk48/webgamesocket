import { Actor } from "./actor";
import { Text } from "./text";
import { Graph } from "../../backend/datastructure/graph";
import { Node2D, StateOfNode2D } from "./node";
import { HybridState } from "../../backend/datastructure/states/hybridstate";
import { RunningState } from "../../backend/datastructure/states/runningstate";
import { MainScene } from "../../frontend/scenes/mainScene";
import { Constant, ModeOfPathPlanning } from "../constant";
import { FransenAlgorithm } from "../../backend/algorithm/FransenAlgorithm";
import { ProposedAlgorithm } from "../../backend/algorithm/ProposedAlgorithm";
import { Forcasting } from "../../backend/statistic/forcasting";
//import { ProposedAlgorithm } from "../algorithm/ProposedAlgorithm";
//import { Forcasting } from "./statistic/forcasting";
//import { Trace } from "../algorithm/trace";
const PriorityQueue = require("priorityqueuejs");

export class AutoAgv extends Actor {
  public graph: Graph;
  public path: Node2D[] | null;
  public curNode: Node2D;
  public endNode: Node2D;
  public cur: number;
  public waitT: number;
  public sobuocdichuyen: number;
  public thoigiandichuyen: number;
  public hybridState: HybridState | undefined;
  public endX: number;
  public endY: number;
  public firstText?: Text;

  public startX: number;
  public startY: number;
  public controller! : FransenAlgorithm;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    endX: number,
    endY: number,
    graph: Graph
  ) {
    super(scene, x * 32, y * 32, "agv");
    this.startX = x * 32;
    this.startY = y * 32;
    this.endX = endX * 32;
    this.endY = endY * 32;

    this.graph = graph;//gán giá trị thuộc tính graph bằng tham số đầu vào
    if(Constant.MODE == ModeOfPathPlanning.FRANSEN)
      this.controller = new FransenAlgorithm(graph, this);
    else{
      var mainScene = scene as MainScene;
      this.controller = new ProposedAlgorithm(graph, this, (mainScene.forcasting as Forcasting));
    }
    this.getBody().setSize(32, 32);
    this.setOrigin(0, 0);
    this.cur = 0;
    this.waitT = 0;
    this.curNode = this.graph.nodes[x][y];
    this.curNode.setState(StateOfNode2D.BUSY);
    this.endNode = this.graph.nodes[endX][endY];
    this.firstText = new Text(
      this.scene,
      endX * 32,
      endY * 32,
      "DES_" + this.getAgvID(),
      "16px",
      "#F00"
    );
    this.path = this.calPathAStar(this.curNode, this.endNode);
    this.sobuocdichuyen = 0;
    this.thoigiandichuyen = performance.now();
    this.estimateArrivalTime(x * 32, y * 32, endX * 32, endY * 32);
    this.hybridState = new RunningState();
  }

  protected preUpdate(time: number, delta: number): void {
    this.hybridState?.move(this);
  }

  public calPathAStar(start: Node2D, end: Node2D): Node2D[]|null {
    return this.controller.calPathAStar(start, end);    
  }

  public changeTarget(): void {
    var mainScene = this.scene as MainScene;
    let agvsToGate1: Array<number> = mainScene.mapOfExits.get(
      "Gate1"
    ) as Array<number>;
    let agvsToGate2: Array<number> = mainScene.mapOfExits.get(
      "Gate2"
    ) as Array<number>;
    var choosenGate = agvsToGate1[2] < agvsToGate2[2] ? "Gate1" : "Gate2";
    var newArray = mainScene.mapOfExits.get(choosenGate) as Array<number>;
    newArray[2]++;
    mainScene.mapOfExits.set(choosenGate, newArray);

    this.startX = this.endX;
    this.startY = this.endY;

    var xEnd: number = newArray[0];
    var yEnd: number = newArray[1];

    this.endX = xEnd * 32;
    this.endY = yEnd * 32;

    var finalAGVs = (mainScene.mapOfExits.get(choosenGate) as Array<number>)[2];

    this.endNode = this.graph.nodes[xEnd][yEnd];
    this.firstText = new Text(
      this.scene,
      xEnd * 32,
      yEnd * 32,
      "DES_" + finalAGVs,
      "16px",
      "#F00"
    );
    this.path = this.calPathAStar(this.curNode, this.endNode);
    this.cur = 0;
    this.sobuocdichuyen = 0;
    this.thoigiandichuyen = performance.now();
    this.estimateArrivalTime(
      32 * this.startX,
      32 * this.startY,
      this.endX * 32,
      this.endY * 32
    );
  }

  public freeze(actor: Actor){
    if(this.collidedActors == null)
    {
      this.collidedActors = new Set();
    }
    if(!this.collidedActors.has(actor)){
      //Thêm agent 
      this.collidedActors.add(actor);
    }
  }
}
