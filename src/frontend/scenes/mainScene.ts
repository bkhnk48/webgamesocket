
import { Scene, Tilemaps } from "phaser";
import io from 'socket.io-client'
import Square from '../objects/square'
import Ball from '../objects/ball'
import { Position } from "../../shared/classes/position";
import { Agent } from "../../shared/classes/agent";
import { Agv } from "../../shared/classes/agv";
import { AutoAgv } from "../../shared/classes/autoagv";
import { Forcasting } from "../../backend/statistic/forcasting";

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
  //private spaceGraph?: Graph;
  //private emergencyGraph?: EmergencyGraph;
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

  create() {

    this.add.text(500,300,"press nowhere to hop", {fontSize:"50px"}).setOrigin(.5,.5)

    this.playerLabel =  this.add.text(-50,-50," this is you").setOrigin(.5,1)
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

}
