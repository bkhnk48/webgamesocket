import { Position } from "../../shared/classes/position";
import { Graph } from "./graph";
import { Node2D, StateOfNode2D } from "../../shared/classes/node";
import { Constant } from "../../shared/constant";
// import { VirtualNode } from "./virtualNode";

export class EmergencyGraph extends Graph {
    constructor(
        width: number,
        height: number,
        danhsachke: Position[][][],
        pathPos: Position[],
      ) {
        super(width, height, danhsachke, pathPos/*, scene*/);
        for (let i = 0; i < width; i++) {
          for (let j = 0; j < height; j++) {
            for (let k = 0; k < danhsachke[i][j].length; k++) {
              let nutke = danhsachke[i][j][k];
              this.nodes[i][j].setVirtualNeighbor(this.nodes[nutke.x][nutke.y]);
            }
          }
        }
    }

  public updateState(): void {
    super.updateState();
    for(let j = 0; j < this.width; j++){
      for(let k = 0; k < this.height; k++){
        let x = this.nodes[j][k].x;
        let y = this.nodes[j][k].y;
        this.nodes[j][k].theta = 0;
        this.nodes[j][k].omega = 0;
        for(let i = 0; i < this.agents.length; i++){
          if(this.agents[i] && this.agents[i].active){
            let dist = Math.sqrt((x - this.agents[i].x)**2 + (y - this.agents[i].y)**2);
            if(dist/this.agents[i].speed < Constant.DELTA_T){
              this.nodes[j][k].omega++;
            }
          }
        }
        if(this.getAutoAgvs() != null){
          this.getAutoAgvs().forEach(
            (item) =>{
              if(item.path){
                for(let i = 0; i < item.path.length; i++){
                        this.nodes[j][k].theta++;
                      this.nodes[j][k].omega++;
                }
              }
            }
          );
        }
      }
    }
  }
}