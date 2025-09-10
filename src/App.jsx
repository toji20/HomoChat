import { useEffect } from "react"
import Chat from "./components/chat/Chat"
import Detail from "./components/detail/Detail"
import List from "./components/list/List"
import Login from "./components/login/Login"
import Notification from "./components/notification/Notification"
import { auth } from "./lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { useUserStore } from "./lib/userStore"
import { useChatStore } from "./lib/useChatStore"
import "./index.css" // Добавим отдельный файл для стилей

const App = () => {
  const {currentUser, isLoading, fetchUserInfo} = useUserStore()
  const {chatId} = useChatStore()
  
  useEffect(() => {
    const unSub = onAuthStateChanged(auth,(user) => {
        fetchUserInfo(user?.uid)
    });

    return () => {
      unSub()
    };
  },[fetchUserInfo]);

  if(isLoading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <div className="loading-text">Loading...</div>
    </div>
  )
  
  return (
    <div className='container'>
      {
      currentUser ? (
      <>
      <List/>
      {chatId && <Chat/>}
      {chatId && <Detail/>}
      </>
    ): (
    <Login/>
    )
    }
    <Notification/>
    </div>
  )
}

export default App