import { useState,useEffect,useRef } from 'react'
import {io} from 'socket.io-client'

import Peer from 'simple-peer'

import './App.css'
const socket = io("https://video-call-server-kappa.vercel.app/")
function App() {



  const [Stream, setStream] = useState()
  const [me, setme] = useState('')
  const [Call, setCall] = useState({})
  const [CallAccepted, setCallAccepted] = useState(false)
  const [CallEnded, setCallEnded] = useState(false)
  const [Name, setName] = useState('MyName')
  const [IdToCall, setIdToCall] = useState('')

  const myVideo = useRef()
  const userVideo = useRef()
  const connectionRef = useRef()
  

  useEffect(() => {

    navigator.mediaDevices.getUserMedia({audio:true,video:true})
    .then((currentStream)=>{
      
      setStream(currentStream)
      myVideo.current.srcObject = currentStream
    
    })


    socket.on("me",(id)=>{setme(id)})

    socket.on("calluser",({signal,from,name:callerName})=>{

      console.log("RECIVED CALL",from);

      setCall({isReceivedCall:true,from , name:callerName, signal})

    })
    

  
  }, [])



  const AnswerCall = () =>{

    setCallAccepted(true)

    const peer = new Peer({ initiator: false, trickle: false, stream:Stream });


   
    peer.on("signal",(data)=>{
  
      socket.emit("answercall",{signal:data,to:Call.from})
    })

    peer.on('stream', (currentStream) => {
      console.log("signal",currentStream);
      userVideo.current.srcObject = currentStream;
    });






    peer.signal(Call.signal)


    connectionRef.current = peer



  }
  


const CallUser = (id) =>{


  const peer = new Peer({ initiator: true, trickle: false, stream:Stream });



  
    peer.on("signal",(data)=>{
      console.log(data);
      console.log("CALLING",id);
      socket.emit("calluser",{userToCall:id,signalData:data,from:me,name:Name})
    })

    peer.on("stream",(data)=>{
 
      userVideo.current.srcObject = data
    })

    socket.on("callaccepted",(signal)=>{

      console.log("CALLACCC!!!!!!!!",signal);

      setCallAccepted(true)
      peer.signal(signal)

    })
    connectionRef.current = peer



}




const LeaveCall = () =>{
  setCallEnded(true)

  connectionRef.current.destroy()

  window.location.reload()
}


const CopyToClipBoard = () =>{
  navigator.clipboard.writeText(me);

  

}



  return (
    <div className="App">


    <div className='flex'>

    <div className="Vid">
        <div>{Name}</div>
        <video playsInline muted ref={myVideo} autoPlay></video>
      </div>


      {
        CallAccepted && !CallEnded && (
          <div className="Vid">
          <div>{Call.name}</div>
          <video playsInline  ref={userVideo} autoPlay></video>
        </div>
        )
      }






    </div>

    <div style={{display:"flex",background:"#494851",justifyContent:"space-around"}}>

      <div style={{display:"flex",flexDirection:"column"}}>
        <dir>Account Info</dir>
        <input placeholder='Enter your Name' style={{padding:"10px",borderRadius:"5px",border:"1px solid white",outline:"none"}} type="text" onChange={(e)=>{setName(e.target.value)}} />
        <button onClick={CopyToClipBoard}>Copy My ID</button>
      </div>

      <div style={{display:"flex",flexDirection:"column"}}>
        <dir>Make a call</dir>
        <input placeholder='Enter your Friend ID' style={{padding:"10px",borderRadius:"5px",border:"1px solid white",outline:"none"}} type="text" onChange={(e)=>{setIdToCall(e.target.value)}} />
       {

        CallAccepted && !CallEnded ? (
           <button style={{backgroundColor:"red"}} onClick={LeaveCall}>Close this shit</button>
        ): (
          <button onClick={()=>{CallUser(IdToCall)}}>Call !</button>
        )


       }
      </div>


    </div>

   

    {

      Call.isReceivedCall && !CallAccepted && (
        <div>

          {Call.name} is Calling !!


          <button onClick={AnswerCall}>Answer</button>

        </div>
      )



    }



     
    </div>
  )
}

export default App
