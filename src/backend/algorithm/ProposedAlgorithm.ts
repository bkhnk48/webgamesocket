import { Node2D } from "../../shared/classes/node";
import { Forcasting } from "../statistic/forcasting";
import { Graph } from "../datastructure/graph";
import { FransenAlgorithm } from "./FransenAlgorithm";
import { Constant } from "../../shared/constant";
import { AutoAgv } from "../../shared/classes/autoagv";

export class ProposedAlgorithm extends FransenAlgorithm{
    private forcasting! : Forcasting;
    constructor(graph: Graph, autoAgv: AutoAgv, forcasting : Forcasting){
        super(graph, autoAgv);
        this.forcasting = forcasting;
    }

    /*
    * Would-be removed function
    */
    private deprecatedCalPathAStar(start: Node2D, end: Node2D): Node2D[]|null {
        /**
           * Khoi tao cac bien trong A*
        */
        let openSet: Node2D[] = [];
        let closeSet: Node2D[] = [];
        let path: Node2D[] = [];
        let astar_f: number[][] = new Array(this.width);
        let astar_g: number[][] = new Array(this.width);
        let astar_h: number[][] = new Array(this.width);
        let previous: Node2D[][] = new Array(this.width);
        for (let i = 0; i < this.width; i++) {
          astar_f[i] = new Array(this.height);
          astar_g[i] = new Array(this.height);                          
          astar_h[i] = new Array(this.height);
          previous[i] = new Array(this.height);
          for (let j = 0; j < this.height; j++) {
            //this.
            astar_f[i][j] = 0;
            //this.
            astar_g[i][j] = 0;
            //this.
            astar_h[i][j] = 0;
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
              astar_f[openSet[i].x][openSet[i].y] <
                  astar_f[openSet[winner].x][openSet[winner].y]
            ) {
              winner = i;
            }
          }
          let current = openSet[winner];
          if (openSet[winner].equal(end)) {
            let cur: Node2D = this.graph?.nodes[end.x][end.y] as Node2D;
            path.push(cur);
            while (previous[cur.x][cur.y] != undefined
              ) {
              path.push(previous[cur.x][cur.y]);
              cur = previous[cur.x][cur.y];
            }
            path.reverse();
            this.totalCost = astar_f[end.x][end.y];
            previous.splice(0, previous.length)
            //console.log("Cost: " + this.totalCost);
            //console.assert(lengthOfPath == path.length, "path has length: " + path.length + " instead of " + 
            return /*this.*/path;
          }
          openSet.splice(winner, 1);
          closeSet.push(current);
          let neighbors = [current.nodeN, current.nodeE, current.nodeS, current.nodeW,
                            current.nodeVN, current.nodeVE, current.nodeVS, current.nodeVW ];
          
          for (let i = 0; i < neighbors.length; i++) {
            let neighbor = neighbors[i];
            if (neighbor != null) {
              if (!this.isInclude(neighbor, closeSet)) {
                let timexoay = 0;
                if (
                  previous[current.x][current.y] &&
                  //!this.previous[current.x][current.y].isUndefined &&
                  neighbor.x != previous[current.x][current.y].x &&
                  neighbor.y != previous[current.x][current.y].y
                ) {
                  timexoay = 1;
                }
                let tempG = /*this*/astar_g[current.x][current.y]; //+ 1 + current.getW() + timexoay;
                if(i >= 4) tempG += Constant.getEmergencyMoving(1 + timexoay);
                if (this.isInclude(neighbor, openSet)) {
                  if (tempG < /*this.*/astar_g[neighbor.x][neighbor.y]) {
                    /*this.*/astar_g[neighbor.x][neighbor.y] = tempG;
                  }
                } else {
                  //this.
                  astar_g[neighbor.x][neighbor.y] = tempG;
                  openSet.push(neighbor);
                  //lengthOfPath++;
                }
                //this.
                //astar_h[neighbor.x][neighbor.y] = this.heuristic(start, neighbor, end, previous);
                //this.
                astar_f[neighbor.x][neighbor.y] = astar_h[neighbor.x][neighbor.y] + /*this.*/astar_g[neighbor.x][neighbor.y];
                //this.
                previous[neighbor.x][neighbor.y] = current;
                //previous[neighbor.x][neighbor.y].isUndefined = false;
              }//end of if (!this.isInclude(neighbor, closeSet)) {
            }
          }
        }//end of while (openSet.length > 0)
        console.log("Path not found!");
        this.totalCost = Number.POSITIVE_INFINITY;
        return null;
    }

    public calculateNeighbors(node: Node2D, openSet: Node2D[], closeSet: Node2D[], start: Node2D, end: Node2D): void{
        let neighbors = this.getNeighbors(node);
          
        for (let i = 0; i < neighbors.length/2; i++) {
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
              this.previous[neighbor.x][neighbor.y] = node;
              
              let tempG = this.astar_g[node.x][node.y] + this.getCostOfEdge(node, timexoay);//1 + current.getW() + timexoay;
              //if(i >= 4) tempG += Constant.getEmergencyMoving(1 + timexoay);
              let tempVirtualG = Constant.getEmergencyMoving(1 + timexoay);
              let tempH = super.heuristic(start, neighbor, end);
              let virtualNeighbor = neighbors[i + neighbors.length/2];
              //if(virtualNeighbor == null && neighbor != null){
              //  console.log("Why null???");
              //}
              let tempVirtualH = this.heuristic(start, virtualNeighbor, end, true);
              let chooseVirtual = false;
              if(tempG + tempH > tempVirtualG + tempVirtualH)
              {
                tempG = tempVirtualG;
                tempH = tempVirtualH;
                chooseVirtual = true;
              }

              if (this.isInclude(neighbor, openSet)) {
                if (tempG < this.astar_g[neighbor.x][neighbor.y]) {
                  this.astar_g[neighbor.x][neighbor.y] = tempG;
                }
              } else {
                this.astar_g[neighbor.x][neighbor.y] = tempG;
                openSet.push(neighbor);
                //lengthOfPath++;
              }
              this.astar_h[neighbor.x][neighbor.y] = tempH; //this.heuristic(start, neighbor, end/*, previous*/);
              this.astar_f[neighbor.x][neighbor.y] = tempG + tempH; //this.astar_h[neighbor.x][neighbor.y] + this.astar_g[neighbor.x][neighbor.y];
              
              this.isVirtual[neighbor.x][neighbor.y] = chooseVirtual;
            }//end of if (!this.isInclude(neighbor, closeSet)) {
          }
        }
    }

    public excludeVirtualNodes(path: Node2D[]){
      for(let i = 0; i < this.width; i++){
        let found : boolean = false;
        for(let j = 0; j < this.height; j++){
          for(let k = 0; k < path.length && !found; k++){
            if(path[k].x == i && path[k].y == j){
              found = true;
            }
          }
          if(!found)
            this.isVirtual[i][j] = false;
        }
      }
    }

    public heuristic(node0: Node2D, node1: Node2D, node2: Node2D/*, previous: Node2D[][]*/, isEmergency: boolean = false): number {
      let result : number = super.heuristic(node0, node1, node2/*, this.previous*/);
      let cur: Node2D = this.graph?.nodes[node1.x][node1.y] as Node2D;
      let sumNormal : number = 0;
      //let countNormal : number = 0;
      let sumVirtual : number = 0;
      //let harmlessness : number = 0;
      if(isEmergency)
        sumVirtual += cur.theta;
      else
        sumNormal += cur.omega;
      cur = this.previous[cur.x][cur.y];
      if(cur.equal(node0)){
        if(this.isVirtual[cur.x][cur.y]){
          sumVirtual += cur.theta;
        }
        else
        {
          sumNormal += cur.omega;
          //countNormal++;
        }
      }
      else{
        //console.log(node0.x + " " + node0.y);
        while (this.previous[cur.x][cur.y] != undefined && 
          !this.previous[cur.x][cur.y].equal(node0)
          ) {
          //if(cur.isVirtualNode){
          if(this.isVirtual[cur.x][cur.y]){
            sumVirtual += cur.theta;
          }
          else
          {
            sumNormal += cur.omega;
            //countNormal++;
          }
          cur = this.previous[cur.x][cur.y];
          //console.log("Loop Infinity!");
        }
      }
      /*if(countNormal != 0){
          sumNormal = this.forcasting.averageAverageNormalWaitingTime * sumNormal/countNormal;
          console.log("Count normal: " + countNormal);
      }*/

      sumNormal = this.forcasting.averageAverageNormalWaitingTime * sumNormal
      sumVirtual = this.forcasting.averageAverageEmergencyWaitingTime*sumVirtual;
      result += (sumVirtual + sumNormal);
      let arrivalTime = result + Math.floor(performance.now()/1000);
      let diff = Math.abs(arrivalTime - this.autoAgv.getExpectedTime());

      if(diff < Constant.DELTA_T)
          return 0;
      else{
          return Constant.getEmergencyMoving(diff);
      }
      //return result;
    }

    public getNeighbors(node: Node2D): Node2D[]{
        return [node.nodeN as Node2D, //this order is very important, pls dont change it  
                    node.nodeE as Node2D, 
                    node.nodeS as Node2D, 
                    node.nodeW as Node2D,
                    node.nodeVN as Node2D, 
                    node.nodeVE as Node2D,
                    node.nodeVS as Node2D,
                    node.nodeVW as Node2D];
    }
      
    public getCostOfEdge(node: Node2D, xoay: number) : number{
        return 0;
    }


}