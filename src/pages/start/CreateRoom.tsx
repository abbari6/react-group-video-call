import React, { FC, useState } from "react"
import { Link } from "react-router-dom"
import { v4 } from "uuid"

export const CreateRoom: FC = () => {
  const [token, setToken] = useState('');
  const handle =()=>{
    localStorage.setItem('token', token);
  }
  return (
    <>
      <Link to={`/${v4()}`}>
        <button>Create Room</button>
      </Link>
      <input type="text" placeholder="enter token" onChange={(e)=>setToken(e.target.value)}  />
      <button onClick={handle}>  submit token</button>
    </>
  )
}
