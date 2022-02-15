import { Position } from "../shared/classes/position";
import { Constant } from "../shared/constant";

interface UserData {
    socketId: string,
    loginTime: number,
    x: number,
    y:number,
    vx: number,
    vy:number
    angle: number,
    color: string
}

interface AgvData{
    socketId: string,
    x: number,
    y: number
}

interface RecentData {
    socketId: string,
    x: number,
    y:number,
    vx: number,
    vy:number,
    angle: number
}

export function ServerCommunication(io, socket) {
    let recentUpdates: RecentData[] = [] //array to store socketids and player data of each connection

    socket.on("ready", (pathPos: Position[])=>{
        let newPlayer = createNewUser(socket)
        
        let r = Math.floor(Math.random() * pathPos.length);
        while(!Constant.validDestination(pathPos[r].x, pathPos[r].y, 1, 14)){
            r = Math.floor(Math.random() * pathPos.length);
        }
        socket.emit("first agv", newPlayer, r);
        //socket.broadcast.emit("add opponent", newPlayer);
        //currentUsers.push(newPlayer)  //add user for data tracking/sharing
    })

    function createNewUser(socket){
        let d = new Date();
        let time = d.toLocaleString('en-US', {
          hour12: true,
          timeZone: 'America/Los_Angeles'
        });
        
        let user: UserData = {
          socketId : socket.id,
          loginTime : new Date().getTime(),
          x: 200+Math.random()*600,
          y: 100+Math.random()*200,
          angle: Math.random()*180,
          color: "0x"+Math.floor(Math.random()*16777215).toString(16),
          vx: 1-Math.random()*2,
          vy: 1-Math.random()*2
        }  
        return user
    }

}