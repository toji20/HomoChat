import { useEffect, useRef, useState } from 'react';
import './chat.css';
import EmojiPicker from 'emoji-picker-react';
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useChatStore } from '../../lib/useChatStore';
import { useUserStore } from '../../lib/userStore';
import { supabase } from '../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';

const Chat = () => {
  const { isCurrentUserBlocked, isReceiverBlocked} = useChatStore()
  const [img, setImg] = useState({
    file: null,
    url: ''
  });
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [chat, setChat] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { chatId, user } = useChatStore();
  const { currentUser } = useUserStore();
  
  const endRef = useRef(null);

  // Прокрутка к последнему сообщению
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  // Подписка на изменения чата
  useEffect(() => {
    if (!chatId) return;
    
    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      setChat(res.data());
    });

    return () => unSub();
  }, [chatId]);

  // Добавление эмодзи
  const handleEmoji = (e) => {
    setText(prev => prev + e.emoji);
  };

  // Обработчик выбора изображения
  const handleImgChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImg({
      file,
      url: URL.createObjectURL(file) // Превью изображения
    });
  };

  // Загрузка изображения в Supabase Storage
  const uploadImageToStorage = async (file) => {
    if (!file) return null;
    
    const fileName = `${Date.now()}_${uuidv4()}`;
    
    try {
      const { data, error } = await supabase
        .storage
        .from('avatars')
        .upload(fileName, file);
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase
        .storage
        .from('avatars')
        .getPublicUrl(data.path);
      
      return publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
      return null;
    }
  };

  // Отправка сообщения
  const handleSend = async () => {
    if ((!text.trim() && !img.file) || !chatId || !currentUser?.uid) {
      toast.warn("Message cannot be empty");
      return;
    }

    setIsLoading(true);
    
    try {
      let imgUrl = null;
      if (img.file) {
        imgUrl = await uploadImageToStorage(img.file);
      }

      // Добавляем сообщение в чат
      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion({
          senderId: currentUser.uid,
          text,
          ...(imgUrl && { img: imgUrl }),
          createdAt: new Date()
        })
      });

      // Обновляем lastMessage для обоих пользователей
      const userIDs = [currentUser.uid, user.uid];
      await Promise.all(userIDs.map(async (id) => {
        const userChatRef = doc(db, "userChats", id);
        const userChatSnap = await getDoc(userChatRef);

        if (userChatSnap.exists()) {
          const chats = [...userChatSnap.data().chats];
          const chatIndex = chats.findIndex((c) => c.chatId === chatId);

          if (chatIndex !== -1) {
            chats[chatIndex] = {
              ...chats[chatIndex],
              lastMessage: text || "Image",
              isSeen: id === currentUser.uid,
              updatedAt: Date.now()
            };
            await updateDoc(userChatRef, { chats });
          }
        }
      }));

      // Сбрасываем состояние
      setImg({ file: null, url: '' });
      setText('');
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

return (
    <div className='chat'>
      <div className="top">
        <div className="user">
          <img src={user?.avatar || "./avatar.png"} alt="" />
          <div className="texts">
            <span>{user?.username || "Unknown"}</span>
            <p>{chat?.lastMessage || "No messages yet"}</p>
          </div>
        </div>
        <div className="icons">
          <img src="./phone.png" alt="" />
          <img src="./video.png" alt="" />
          <img src="./info.png" alt="" />
        </div>
      </div>
      
      <div className="center">
        {chat?.messages?.map((message) => (
          <div 
            className={`message ${message.senderId === currentUser?.uid ? "own" : ""}`} 
            key={message.createdAt}
          >
            {message.img && <img src={message.img} alt="Sent content" className='messageImg'/>}
            <div className="texts">
              <p>{message.text}</p>
            </div>
          </div>
        ))}
        {img.url && (
          <div className="message own">
            <div className="texts">
              <img src={img.url} alt="Preview"/>
            </div>
          </div>
        )}
        <div ref={endRef}></div>
      </div>
      
      <div className="bottom">
        <div className="icons">
          <label htmlFor="file">
            <img src="./img.png" alt="Attach file" />
            <input 
              type="file" 
              id="file" 
              style={{ display: "none" }} 
              onChange={handleImgChange} 
              accept="image/*"
            />
          </label>
          <img src="./camera.png" alt="Take photo" />
          <img src="./mic.png" alt="Record voice" />
        </div>
        
        <textarea
          type="text" 
          placeholder='Type a message...'
          value={text}
          onChange={(e) => setText(e.target.value)}
          className='input'
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        />
        
        <div className="emoji">
          <img 
            src="./emoji.png" 
            alt="Emoji picker" 
            onClick={() => setOpen((prev) => !prev)}
          />
          <div className="picket">
            <EmojiPicker open={open} onEmojiClick={handleEmoji}/>
          </div>
        </div>
        
        <button 
          className='sendButton' 
          onClick={handleSend}
          disabled={isLoading || isCurrentUserBlocked || isReceiverBlocked}
        >
          {isLoading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default Chat;