
import { Scene, Tilemaps } from "phaser";
import io from 'socket.io-client'
import Square from '../objects/square'
import Ball from '../objects/ball'
import { Position } from "../../shared/classes/position";
import { Agent } from "../../shared/classes/agent";
import { Agv } from "../../shared/classes/agv";
import { AutoAgv } from "../../shared/classes/autoagv";
import { Forcasting } from "../../backend/statistic/forcasting";
import { Graph } from "../../backend/datastructure/graph";
import { EmergencyGraph } from "../../backend/datastructure/emergencygraph";
import { Constant, ModeOfPathPlanning } from "../../shared/constant";
import { RandomDistribution } from "../../backend/algorithm/random";

interface UserData {
  socketId: string,
  loginTime: string,
  x: number,
  y:number,
  vx: number,
  vy:number
  angle: number,
  color: string
}


export class MainScene extends Phaser.Scene {
  private agv!: Agv;
  public autoAgvs!: Set<AutoAgv>; 
  private map!: Tilemaps.Tilemap;
  private tileset!: Tilemaps.Tileset;
  private groundLayer!: Tilemaps.TilemapLayer;
  private elevatorLayer!: Tilemaps.TilemapLayer;
  private roomLayer!: Tilemaps.TilemapLayer;
  private gateLayer!: Tilemaps.TilemapLayer;
  private wallLayer!: Tilemaps.TilemapLayer;
  private doorLayer!: Tilemaps.TilemapLayer;
  private pathLayer!: Tilemaps.TilemapLayer;
  private noPathLayer!: Tilemaps.TilemapLayer;
  private bedLayer!: Tilemaps.TilemapLayer;
  private groundPos!: Position[];
  private pathPos!: Position[];
  private danhsachke: Position[][][];
  private saveButton?: Phaser.GameObjects.Text;
  private loadButton?: Phaser.GameObjects.Text;
  private mapData: any = {};
  private spaceGraph?: Graph;
  private emergencyGraph?: EmergencyGraph;
  private doorPos!: Position[];
  private timeText?: Phaser.GameObjects.Text;
  private averageText?: Phaser.GameObjects.Text;
  private sec: number = 0;
  public timeTable?: Phaser.GameObjects.Text;
  private harmfulTable?: Phaser.GameObjects.Text;
  private _harmfullness: number = 0;
  private agents!: Agent[];
  private MAX_AGENT: number = 20;
  private desDom?: Phaser.GameObjects.DOMElement;
  public mapOfExits = new Map([
    ["Gate1", [50, 13, 0]],
    ["Gate2", [50, 14, 0]],
  ]);
  public count : number = 0;
  public forcasting? : Forcasting;

  firstHi = false  
  playersConnectedText: Phaser.GameObjects.Text
  player: Square
  socket: SocketIOClient.Socket
  opponents: Square[] = []

  playerLabel: Phaser.GameObjects.Text


  constructor() {
    super('MainScene')
    this.agents = new Array();
    this.groundPos = new Array();
    this.pathPos = new Array();
    this.danhsachke = new Array(52);
    this.doorPos = new Array();
    this.autoAgvs = new Set();
    this.forcasting = new Forcasting();
    for (let i = 0; i < this.danhsachke.length; i++) {
      this.danhsachke[i] = new Array(28);
      for (let j = 0; j < this.danhsachke[i].length; j++) {
        this.danhsachke[i][j] = [];
      }
    }
    this.forcasting = new Forcasting();
  }

  public get graph(): Graph{
    if(Constant.MODE == ModeOfPathPlanning.FRANSEN){
      return (this.spaceGraph as Graph);
    }
    else{
      return (this.emergencyGraph as Graph);
    }
  }

  init(data: any) { }
  preload() {
    this.load.baseURL = "assets/";
    this.load.image({
      key: "tiles",
      url: "tilemaps/tiles/hospital.png",
    });
    this.load.tilemapTiledJSON("hospital", "tilemaps/json/hospital.json");
    this.load.image("agv", "sprites/agv.png");
    this.load.spritesheet("tiles_spr", "tilemaps/tiles/hospital.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.image("instruction", "sprites/instruction.png");
    this.load.html("setNumAgentForm", "setNumAgents.html");
    this.load.html("des", "des.html");
  }

  public initGraph(): void{
    if(Constant.MODE == ModeOfPathPlanning.FRANSEN){
      this.spaceGraph = new Graph(52, 28, this.danhsachke, this.pathPos);
    }
    else{
      this.emergencyGraph = new EmergencyGraph(52, 28, this.danhsachke, this.pathPos);
    }
  }


  private initMap(): void {
    this.map = this.make.tilemap({
      key: "hospital",
      tileHeight: 32,
      tileWidth: 32,
    });
    this.tileset = this.map.addTilesetImage("hospital", "tiles");
    this.noPathLayer = this.map.createLayer("nopath", this.tileset, 0, 0);
    this.groundLayer = this.map.createLayer("ground", this.tileset, 0, 0);
    this.roomLayer = this.map.createLayer("room", this.tileset, 0, 0);
    this.wallLayer = this.map.createLayer("wall", this.tileset, 0, 0);
    this.pathLayer = this.map.createLayer("path", this.tileset, 0, 0);
    this.doorLayer = this.map.createLayer("door", this.tileset, 0, 0);
    this.elevatorLayer = this.map.createLayer("elevator", this.tileset, 0, 0);
    this.gateLayer = this.map.createLayer("gate", this.tileset, 0, 0);
    this.bedLayer = this.map.createLayer("bed", this.tileset, 0, 0);
    this.noPathLayer.setCollisionByProperty({ collides: true });
    this.roomLayer.setCollisionByProperty({ collides: true });
    this.physics.world.setBounds(
      0,
      0,
      this.groundLayer.width,
      this.groundLayer.height
    );
    this.groundLayer
      .getTilesWithin()
      .filter((v) => v.index != -1)
      .forEach((v) => {
        const pos: Position = new Position(v.x, v.y);
        this.groundPos.push(pos);
      });
    this.pathLayer
      .getTilesWithin()
      .filter((v) => v.index != -1)
      .forEach((v) => {
        const pos: Position = new Position(v.x, v.y);
        this.pathPos.push(pos);
      });
    this.doorLayer
      .getTilesWithin()
      .filter((v) => v.index != -1)
      .forEach((v) => {
        const pos: Position = new Position(v.x, v.y);
        this.doorPos.push(pos);
      });
    this.gateLayer
      .getTilesWithin()
      .filter((v) => v.index != -1)
      .forEach((v) => {
        const pos: Position = new Position(v.x, v.y);
        this.doorPos.push(pos);
      });
  }

  private checkTilesNeighbor(
    tileA: Tilemaps.Tile,
    tileB: Tilemaps.Tile
  ): boolean {
    // neu o dang xet khong co huong
    if (!tileA.properties.direction) {
      if (this.checkTilesUndirection(tileA, tileB)) return true;
    } else {
      // neu o dang xet co huong
      if (tileA.properties.direction == "top") {
        if (tileA.x == tileB.x && tileA.y == tileB.y + 1) {
          return true;
        }
      }
      if (tileA.properties.direction == "right") {
        if (tileA.x + 1 == tileB.x && tileA.y == tileB.y) {
          return true;
        }
      }
      if (tileA.properties.direction == "bottom") {
        if (tileA.x == tileB.x && tileA.y + 1 == tileB.y) {
          return true;
        }
      }
      if (tileA.properties.direction == "left") {
        if (tileA.x == tileB.x + 1 && tileA.y == tileB.y) {
          return true;
        }
      }
    }
    return false;
  }

  private checkTilesUndirection(
    tileA: Tilemaps.Tile,
    tileB: Tilemaps.Tile
  ): boolean {
    if (tileA.x == tileB.x && tileA.y == tileB.y + 1) {
      if (tileB.properties.direction == "top" || !tileB.properties.direction) {
        return true;
      }
    }
    if (tileA.x + 1 == tileB.x && tileA.y == tileB.y) {
      if (
        tileB.properties.direction == "right" ||
        !tileB.properties.direction
      ) {
        return true;
      }
    }
    if (tileA.x == tileB.x && tileA.y + 1 == tileB.y) {
      if (
        tileB.properties.direction == "bottom" ||
        !tileB.properties.direction
      ) {
        return true;
      }
    }
    if (tileA.x == tileB.x + 1 && tileA.y == tileB.y) {
      if (tileB.properties.direction == "left" || !tileB.properties.direction) {
        return true;
      }
    }
    return false;
  }

  private taodanhsachke() {
    let tiles: Tilemaps.Tile[] = [];
    this.pathLayer
      .getTilesWithin()
      .filter((v) => v.index != -1)
      .forEach((v) => {
        tiles.push(v);
      });
    for (let i = 0; i < tiles.length; i++) {
      for (let j = 0; j < tiles.length; j++) {
        if (i != j) {
          if (this.checkTilesNeighbor(tiles[i], tiles[j])) {
            this.danhsachke[tiles[i].x][tiles[i].y].push(
              new Position(tiles[j].x, tiles[j].y)
            );
          }
        }
      }
    }
  }

  create() {

    this.initMap();
    this.taodanhsachke();
    this.initGraph();
    this.desDom = this.add.dom(1790, 600).createFromCache("des");
    this.desDom.setPerspective(800);  

    let r = Math.floor(Math.random() * this.pathPos.length);
    while(!Constant.validDestination(this.pathPos[r].x, this.pathPos[r].y, 1, 14)){
      r = Math.floor(Math.random() * this.pathPos.length);
    }

    this.agv = new Agv(
      this,
      1 * 32,
      14 * 32,
      this.pathPos[r].x * 32,
      this.pathPos[r].y * 32,
      this.pathLayer
    );

    this.agv.setPushable(false);
    if(Constant.MODE == ModeOfPathPlanning.PROPOSE)
      this.emergencyGraph?.setMAgv(this.agv);
    this.addButton();

    this.timeTable && this.agv.writeDeadline(this.timeTable);
    var des = document.getElementById("des");
    if (des) {
      while(des.childNodes.length >= 1) {
        des.firstChild && des.removeChild(des.firstChild);
      }
      des.appendChild(des.ownerDocument.createTextNode(this.timeTable?.text || ""));
    }

    this.createRandomAutoAgv();
    this.events.on("destroyAgent", this.destroyAgentHandler, this);
    this.createAgents(10, 1000);

    this.physics.add.collider(this.agv, this.noPathLayer);
    this.openLinkInstruction();

    setInterval(() => {
      this.sec++;
      this.timeText?.setText(Constant.secondsToHMS(this.sec));
    }, 1000);

    //this.add.text(500,300,"press nonwhere to hop", {fontSize:"50px"}).setOrigin(.5,.5)

    //this.playerLabel =  this.add.text(-50,-50," this is you").setOrigin(.5,1)
    this.playersConnectedText = this.add.text(20,20,"")
    this.matter.world.setBounds(0,0,1024,750, 50,true, true, true, true)
    
      this.socket = io()
      this.socket.on("first hi", (data: UserData, opponentData: UserData[])=>{
        if(this.firstHi != true){
          this.firstHi = true
        this.player = new Square(this, data)     
        opponentData.forEach((o)=>{
          let opponent = new Square(this, o)     
          this.opponents.push(opponent)
        })
        this.time.addEvent({ delay: 1000/60,  loop: true, callback: this.updateState(), callbackScope: this });
        }        
      })

      this.socket.on("add opponent", (data: UserData)=>{
        let opponent = new Square(this, data)     
        this.opponents.push(opponent)
         
      })
      this.socket.on("remove player", (pSocket)=>{
        /*let o:Square[] = this.opponents.filter((player:Square) => { return player.socketId == pSocket})
        if(o && o[0]){
          let p = o[0]
          this.opponents.splice(this.opponents.indexOf(p, 1))
          p.destroy()

        }*/
      })
      this.socket.on("update all", (data: any[])=>{
        data.forEach((p)=>{
          /*let o:Square[] = this.opponents.filter((player:Square) => { return player.socketId == p.socketId})       
          if(o && o[0] && o[0].socketId != this.player.socketId){
            let opponent = o[0]
            opponent.x = p.x
            opponent.y = p.y
            opponent.setVelocityX(p.vx)
            opponent.setVelocityY(p.vY)
            opponent.angle = p.angle
          }*/

        })       
      })  
      
      this.socket.emit("ready")    
      this.input.on("pointerdown", ()=>{
        if(this.player.y>700)
        this.player.applyForce(new Phaser.Math.Vector2(.025-.05*Math.random(), -.05-.125*Math.random()))
      })     
  }

  update(){
    if(this.player){
      this.playerLabel.x = this.player.x
      this.playerLabel.y = this.player.y-40
    }
    
  }

  updateState(){
    let oldX = 0
    let oldY = 0
    let oldAngle = 0

    //send a position update only if position is changed
    return ()=>{

      this.playersConnectedText.setText("clients connected: "+(this.opponents.length+1).toString())


      if(this.player && (Math.abs(this.player.x - oldX) > 3 || Math.abs(this.player.y - oldY) > 3)){
        let data = {
          socketId: this.socket.id,
          x: this.player.x,
          y: this.player.y,
          vx: this.player.body.velocity.x,
          vy: this.player.body.velocity.x,
          angle: this.player.angle
        }
        this.socket.emit("player update", data)
        oldX = this.player.x
        oldY = this.player.y
        oldAngle = this.player.angle
      }         
    }    
  }

  public get harmfullness(): number {
    return this._harmfullness;
  }
  public set harmfullness(value: number) {
    this._harmfullness = value;
    this.harmfulTable
      ?.setText("H.ness: " + this._harmfullness.toFixed(2))
      .setPosition(window.innerWidth - 245, 320);
  }

  private handleClickSaveButton() {
    //alert("Đã lưu map thành công!");
    alert("Not yet finished!!");
  }

  private handleClickLoadButton() {
    const e = document.createElement("input");
    const reader = new FileReader();
    const openFile = (event: any) => {
      var input = event.target;
      var fileTypes = "json";
      if (input.files && input.files[0]) {
        var extension = input.files[0].name.split(".").pop().toLowerCase(),
          isSuccess = fileTypes.indexOf(extension) > -1;
        if (isSuccess) {
          reader.onload = () => {
            if (typeof reader?.result == "string") {
              this.mapData = JSON.parse(reader?.result);
              this.agv.setX(this.mapData.agv.x);
              this.agv.setY(this.mapData.agv.y);
              for (let i = 0; i < this.agents.length; i++) {
                this.agents[i].eliminate();
                this.agents[i] = new Agent(
                  this,
                  new Position(
                    this.mapData.agents[i].startPos.x,
                    this.mapData.agents[i].startPos.y
                  ),
                  new Position(
                    this.mapData.agents[i].endPos.x,
                    this.mapData.agents[i].endPos.y
                  ),
                  this.groundPos,
                  this.mapData.agents[i].id
                );
              }
              // console.log(this.mapData);
              alert("Đã tải map thành công!");
            }
          };
          reader.readAsText(input.files[0]);
        } else {
          alert("File không đúng định dạng. Vui lòng chọn file .json!");
        }
      }
    };
    e.type = "file";
    e.style.display = "none";
    e.addEventListener("change", openFile, false);
    document.body.appendChild(e);
    e.click();
    document.body.removeChild(e);
  }

  addButton(): void {
    this.saveButton = this.add.text(window.innerWidth - 200, 50, "Save data", {
      backgroundColor: "#eee",
      padding: { bottom: 5, top: 5, left: 10, right: 10 },
      color: "#000",
      fontSize: "24px",
      fontStyle: "bold",
    });
    this.loadButton = this.add.text(window.innerWidth - 200, 110, "Load data", {
      backgroundColor: "#eee",
      padding: { bottom: 5, top: 5, left: 10, right: 10 },
      color: "#000",
      fontSize: "24px",
      fontStyle: "bold",
    });
    this.saveButton
      .setInteractive()
      .on("pointerdown", () => this.handleClickSaveButton());
    this.loadButton
      .setInteractive()
      .on("pointerdown", () => this.handleClickLoadButton());
    this.timeText = this.add.text(window.innerWidth - 190, 290, "00:00:00", {
      color: "#D8202A",
      fontSize: "28px",
      fontStyle: "bold",
    });
    this.timeTable = this.add.text(window.innerWidth - 1910, 870, "", {
      color: "#D8202A",
      fontSize: "28px",
      fontStyle: "bold",
    });
    this.timeTable.setVisible(false);
    this.harmfulTable = this.add.text(
      window.innerWidth - 200,
      320,
      "H.ness: 0",
      {
        color: "#D8202A",
        fontSize: "28px",
        fontStyle: "bold",
      }
    );
    this.averageText = this.add.text(
      window.innerWidth - 1700,
      0,
      "average: 0",
      {
        color: "#D8202A",
        fontSize: "28px",
        fontStyle: "bold",
      }
    );
  }

  private createRandomAutoAgv() {
    let r = Math.floor(Math.random() * this.pathPos.length);
    while(!Constant.validDestination(this.pathPos[r].x, this.pathPos[r].y, 1, 13)){
      r = Math.floor(Math.random() * this.pathPos.length);
    }
    if (this.graph) {
      var tempAgv = new AutoAgv(this, 1, 13, this.pathPos[r].x, this.pathPos[r].y, this.graph);
      this.timeTable && tempAgv.writeDeadline(this.timeTable);
      var des = document.getElementById("des");
      if (des) {
        while(des.childNodes.length >= 1) {
          des.firstChild && des.removeChild(des.firstChild);
        }
  
        des.appendChild(des.ownerDocument.createTextNode(this.timeTable?.text || ""));
      }
      this.autoAgvs.add(tempAgv);
      this.graph.setAutoAgvs(this.autoAgvs);
    }
  }

  private destroyAgentHandler(agent: Agent) {
    let index = 0;
    for (let i = 0; i < this.agents.length; i++) {
      if (this.agents[i].getId() == agent.getId()) index = i;
    }
    this.agents.splice(index, 1);
    this.graph.removeAgent(agent);
    this.autoAgvs.forEach(
      (elem) => {
          if(elem.collidedActors.has(agent))
          {
            elem.collidedActors.delete(agent);
          }
      }
    );
  }

  createAgents(numAgentInit: number, time: number) {
    // khoi tao numAgentInit dau tien
    let randoms : number[] = [];
    while (randoms.length < numAgentInit * 2) {
      var r = Math.floor(Math.random() * this.doorPos.length);
      if (randoms.indexOf(r) === -1) randoms.push(r);
    }
    this.agents = [];
    for (let i = 0; i < numAgentInit; i++) {
      let agent = new Agent(
        this,
        this.doorPos[randoms[i]],
        this.doorPos[randoms[i + numAgentInit]],
        this.groundPos,
        Math.floor(Math.random() * 100)
      );
      agent.setPushable(false);
      this.physics.add.collider(agent, this.roomLayer);
      this.physics.add.overlap(this.agv, agent, () => {
        agent.handleOverlap();
        this.agv.handleOverlap();
      });
      this.autoAgvs.forEach(
        (item) => {
          item && this.physics.add.overlap(agent, item, () => {
            item.freeze(agent);
          });
        }
      );
      this.agents.push(agent);
    }

    this.graph.setAgents(this.agents);

    // thêm ngẫu nhiên agent vào môi trường
    setInterval(() => {
      if (this.agents.length >= this.MAX_AGENT) return;
      var rand = new RandomDistribution();
      var ran = rand.getProbability();
      if (ran > 1) console.log(rand.getName() + " " + ran);
      if (ran > 0.37) return;
      var r1 = Math.floor(Math.random() * this.doorPos.length);
      var r2 = Math.floor(Math.random() * this.doorPos.length);
      let agent = new Agent(
        this,
        this.doorPos[r1],
        this.doorPos[r2],
        this.groundPos,
        Math.floor(Math.random() * 100)
      );
      agent.setPushable(false);
      this.physics.add.collider(agent, this.roomLayer);
      this.physics.add.overlap(this.agv, agent, () => {
        agent.handleOverlap();
        this.agv.handleOverlap();
      });
      this.autoAgvs.forEach(
        (item) => {
          item && this.physics.add.overlap(agent, item, () => {
            item.freeze(agent);
          });
        }
      );
      this.agents.push(agent);
      this.graph.setAgents(this.agents);
      
      this.count++;
      if(this.count == 10){
        this.createRandomAutoAgv();
        this.count = 0;
      }
    }, time);
  }

  openLinkInstruction() {
    const instruction = this.add
      .image(window.innerWidth - 125, window.innerHeight - 90, "instruction")
      .setInteractive();
    instruction.on("pointerup", () => {
      window.open(
        "https://github.com/phamtuanhien/Project20211_HappyHospital#readme"
      );
    });
  }
}
