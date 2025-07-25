import './addUser.css'
import { arrayUnion, collection, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where, getDoc } from 'firebase/firestore'
import { useState } from 'react'
import { db } from '../../lib/firebase'
import { useUserStore } from "../../lib/userStore"

const AddUser = () => {
  const [user, setUser] = useState(null)
  const {currentUser} = useUserStore()

  const handleSearch = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target);
    const username = formData.get("username").trim();
    try {
      const userRef = collection(db, "users");
      const q = query(userRef, where("username", "==", username));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setUser(querySnapshot.docs[0].data());
      }
    } catch (error) {
      console.log(error);
    }
  }

  const handleAdd = async () => {
    try {
      // Создаем новый чат
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

    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className='addUser'>
      <form onSubmit={handleSearch}>
        <input type="text" placeholder='Username' name='username'/>
        <button>Search</button>
      </form>
      {user && (
        <div className='user'>
          <div className="detail">
            <img src={user.avatar || "./avatar.png"} alt="" />
            <span>{user.username}</span>
          </div>
          <button onClick={handleAdd}>Add User</button>
        </div>
      )}
    </div>
  )
}

export default AddUser