import './addUser.css'
import { arrayUnion, collection, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where, getDoc } from 'firebase/firestore'
import { useState } from 'react'
import { db } from '../../lib/firebase'
import { useUserStore } from "../../lib/userStore"

const AddUser = () => {
  const [user, setUser] = useState(null)
  const [isAlreadyAdded, setIsAlreadyAdded] = useState(false)
  const {currentUser} = useUserStore()

  const handleSearch = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target);
    const username = formData.get("username").trim();
    
    if (username === currentUser.username) {
      setUser(null);
      setIsAlreadyAdded(false);
      return;
    }
    
    try {
      const userRef = collection(db, "users");
      const q = query(userRef, where("username", "==", username));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const foundUser = querySnapshot.docs[0].data();
        setUser(foundUser);
        
        const currentUserChatRef = doc(db, "userChats", currentUser.uid);
        const currentUserChatSnap = await getDoc(currentUserChatRef);
        
        if (currentUserChatSnap.exists()) {
          const chats = currentUserChatSnap.data().chats || [];
          const isExisting = chats.some(chat => chat.receiverId === foundUser.uid);
          setIsAlreadyAdded(isExisting);
        } else {
          setIsAlreadyAdded(false);
        }
      } else {
        setUser(null);
        setIsAlreadyAdded(false);
      }
    } catch (error) {
      console.log(error);
      setUser(null);
      setIsAlreadyAdded(false);
    }
  }

  const handleAdd = async () => {
    if (isAlreadyAdded) return;
    
    try {
      const newChatRef = doc(collection(db, "chats"));
      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });

      // Ссылки на документы userChats
      const currentUserChatRef = doc(db, "userChats", currentUser.uid);
      const userChatRef = doc(db, "userChats", user.uid);

      // Проверяем существование документов и создаем при необходимости
      const currentUserChatSnap = await getDoc(currentUserChatRef);
      if (!currentUserChatSnap.exists()) {
        await setDoc(currentUserChatRef, { chats: [] });
      }

      const userChatSnap = await getDoc(userChatRef);
      if (!userChatSnap.exists()) {
        await setDoc(userChatRef, { chats: [] });
      }

      // Обновляем документы
      await updateDoc(currentUserChatRef, {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: user.uid,
          updatedAt: Date.now(),
        })
      });

      await updateDoc(userChatRef, {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: currentUser.uid,
          updatedAt: Date.now(),
        })
      });

      // Сбрасываем состояние после добавления
      setUser(null);
      setIsAlreadyAdded(false);
      
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className='addUser'>
      <h2>Add New User</h2>
      <form onSubmit={handleSearch}>
        <input type="text" placeholder='Enter username' name='username'/>
        <button>Search</button>
      </form>
      {user && (
        <div className='user'>
          <div className="detail">
            <img src={user.avatar || "./avatar.png"} alt="" />
            <span>{user.username}</span>
          </div>
          {isAlreadyAdded ? (
            <button disabled className="already-added">
              Already Added
            </button>
          ) : (
            <button onClick={handleAdd} className="add-btn">Add User</button>
          )}
        </div>
      )}
    </div>
  )
}

export default AddUser