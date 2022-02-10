import { Position } from "../../shared/classes/position";
import { Node2D, StateOfNode2D } from "../../shared/classes/node";
import { Agent } from "../../shared/classes/agent";
import { AutoAgv } from "../../shared/classes/autoagv";
import { Agv } from "../../shared/classes/agv";
import { Graph } from "../datastructure/graph";
//import { Trace } from "./trace";
import { Constant } from "../../shared/constant";

export class FransenAlgorithm{

  public graph?: Graph;
  //public nodes: Node2D[][];
  public width: number = 0;
  public height: number = 0;
  //public agents: Agent[] = [];
  //public busy: number[][] = [];
  //public pathPos: Position[];
  //private autoAgvs!: Set<AutoAgv>;
  //private agv!: Agv;
  public totalCost: number = Number.POSITIVE_INFINITY;
  public isVirtual!: boolean[][];//Trace[][];
  public autoAgv!: AutoAgv;
  //private path: Node2D[] = [];
  public astar_f!: number[][] ; //= new Array(this.width);
  public astar_g!: number[][] ; //= new Array(this.width);
  public astar_h!: number[][] ; //= new Array(this.width);
  public previous!: Node2D[][] ; //= new Array(this.width);

  constructor(graph: Graph, agv: AutoAgv){
      this.graph = graph;
      this.width = graph.width;
      this.height = graph.height;
      this.autoAgv = agv;
      this.astar_f = new Array(this.width);
      this.astar_g = new Array(this.width);
      this.astar_h = new Array(this.width);
      //this.traces = [];
      //this.previous = new Array(this.width);
      this.isVirtual = new Array(this.width);
      for (let i = 0; i < this.width; i++) {
        this.astar_f[i] = new Array(this.height);
        this.astar_g[i] = new Array(this.height);
        this.astar_h[i] = new Array(this.height);
        //this.previous[i] = new Array(this.height);
        this.isVirtual[i] = new Array(this.height);
        for (let j = 0; j < this.height; j++) {
          this.astar_f[i][j] = 0;
          this.astar_g[i][j] = 0;
          this.astar_h[i][j] = 0;
          //this.previous[i][j] = null;
          this.isVirtual[i][j] = false;//new Trace(-1, -1, false);
        }
      }
  }

  public calPathAStar(start: Node2D, end: Node2D): Node2D[]|null {
    /**
       * Khoi tao cac bien trong A*
    */
    let openSet: Node2D[] = [];
    let closeSet: Node2D[] = [];
    let path: Node2D[] = [];
    //this.traces = [];
    //let astar_f: number[][] = new Array(this.width);
    //let astar_g: number[][] = new Array(this.width);
    //let astar_h: number[][] = new Array(this.width);
    this.previous /*: Node2D[][]*/ = new Array(this.width);
    for (let i = 0; i < this.width; i++) {
      //astar_f[i] = new Array(this.height);
      //astar_g[i] = new Array(this.height);
      //astar_h[i] = new Array(this.height);
      this.previous[i] = new Array(this.height);
      for (let j = 0; j < this.height; j++) {
        this.astar_f[i][j] = 0;
        //astar_f[i][j] = 0;
        this.astar_g[i][j] = 0;
        //astar_g[i][j] = 0;
        this.astar_h[i][j] = 0;
        //astar_h[i][j] = 0;
        this.isVirtual[i][j] = false;
        //this.traces[i][j].isEmergencyNode = false;
        /*if(this.previous[i][j] != undefined){
          this.previous[i][j].isUndefined = true;
        }*/
      }
    }
    /**
     * Thuat toan
      */
    openSet.push(this.graph?.nodes[start.x][start.y] as Node2D);
    while (openSet.length > 0) {
      let winner = 0;
      for (let i = 0; i < openSet.length; i++) {
        if (
          this.astar_f[openSet[i].x][openSet[i].y] <
          //astar_f[openSet[i].x][openSet[i].y] <
          this.astar_f[openSet[winner].x][openSet[winner].y]
          //astar_f[openSet[winner].x][openSet[winner].y]
        ) {
          winner = i;
        }
      }
      let current = openSet[winner];
      if (openSet[winner].equal(end)) {
        let cur: Node2D = this.graph?.nodes[end.x][end.y] as Node2D;
        //this.
        path.push(cur);
        while (this.previous[cur.x][cur.y] != undefined
          //&& !this.previous[cur.x][cur.y].isUndefined
          ) {
          //this.
          path.push(this.previous[cur.x][cur.y]);
          cur = this.previous[cur.x][cur.y];
        }
        //this.
        path.reverse();
        this.excludeVirtualNodes(path);
        this.totalCost = this.astar_f[end.x][end.y];
        //astar_f[end.x][end.y];
        this.previous.splice(0, this.previous.length)
        //console.log("Cost: " + this.totalCost);
        //console.assert(lengthOfPath == path.length, "path has length: " + path.length + " instead of " + 
        return /*this.*/path;
      }
      openSet.splice(winner, 1);
      closeSet.push(current);
      this.calculateNeighbors(current, openSet, closeSet, start, end);      
    }//end of while (openSet.length > 0)
    console.log("Path not found!");
    this.totalCost = Number.POSITIVE_INFINITY;
    return null;
  }
  
  public heuristic(node0: Node2D, node1: Node2D, node2: Node2D, isEmergency: boolean = false/*, previous: Node2D[][]*/): number {
    return (Math.abs(node1.x - node2.x) + Math.abs(node1.y - node2.y))/32;
  }

  public isInclude(node: Node2D, nodes: Node2D[]): boolean {
    for (let i = 0; i < nodes.length; i++) {
      if (node.equal(nodes[i])) return true;
    }
    return false;
  }

  public getNeighbors(node: Node2D): Node2D[]{
    return [node.nodeN as Node2D, node.nodeE as Node2D, node.nodeS as Node2D, node.nodeW as Node2D];
  }

  public getCostOfEdge(node: Node2D, xoay: number) : number{
    return (1 + node.getW() + xoay);
  }

  public excludeVirtualNodes(path: Node2D[]){
  }

  public calculateNeighbors(node: Node2D, openSet: Node2D[], closeSet: Node2D[], start: Node2D, end: Node2D): void{
    //let neighbors = this.getNeighbors(node);
    //let arr: number[] = new Array(3*neighbors.length);
    //return arr;
    //let additionalNodes : Node2D[] = [];
    let neighbors = this.getNeighbors(node);
                //[current.nodeN, current.nodeE, current.nodeS, current.nodeW//,
                  //current.nodeVN, current.nodeVE, current.nodeVS, current.nodeVW 
                //];
      
    for (let i = 0; i < neighbors.length; i++) {
      let neighbor = neighbors[i];
      if (neighbor != null) {
        if (!this.isInclude(neighbor, closeSet)) {
          let timexoay = 0;
          if (
            this.previous[node.x][node.y] &&
            //!this.previous[current.x][current.y].isUndefined &&
            neighbor.x != this.previous[node.x][node.y].x &&
            neighbor.y != this.previous[node.x][node.y].y
          ) {
            timexoay = 1;
          }
          let tempG = this.astar_g[node.x][node.y] + this.getCostOfEdge(node, timexoay);//1 + current.getW() + timexoay;
          if(i >= 4) tempG += Constant.getEmergencyMoving(1 + timexoay);
          if (this.isInclude(neighbor, openSet)) {
            if (tempG < this.astar_g[neighbor.x][neighbor.y]) {
              this.astar_g[neighbor.x][neighbor.y] = tempG;
            }
          } else {
            this.astar_g[neighbor.x][neighbor.y] = tempG;
            //astar_g[neighbor.x][neighbor.y] = tempG;
            openSet.push(neighbor);
            //lengthOfPath++;
          }
          this.astar_h[neighbor.x][neighbor.y] = this.heuristic(start, neighbor, end/*, previous*/);
          //astar_h[neighbor.x][neighbor.y] = this.heuristic(start, neighbor, end, previous);
          this.astar_f[neighbor.x][neighbor.y] = this.astar_h[neighbor.x][neighbor.y] + this.astar_g[neighbor.x][neighbor.y];
          //astar_f[neighbor.x][neighbor.y] = astar_h[neighbor.x][neighbor.y] + /*this.*/astar_g[neighbor.x][neighbor.y];
          //this.
          this.previous[neighbor.x][neighbor.y] = node;
          //this.isVirtual[neighbor.x][neighbor.y] = false;
          //this.traces[neighbor.x][neighbor.y].setTrace(current, i >= 4);
          //previous[neighbor.x][neighbor.y].isUndefined = false;
        }//end of if (!this.isInclude(neighbor, closeSet)) {
      }
    }
  }
}