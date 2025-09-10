import { useEffect, useState } from 'react'
import './chatList.css'
import AddUser from '../../addUser/AddUser'
import { useUserStore } from '../../../lib/userStore'
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore'
import { auth, db } from '../../../lib/firebase'
import { useChatStore } from '../../../lib/useChatStore'
import { supabase } from '../../../lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'react-toastify'

const ChatList = () => {
    const [addMode, setAddMode] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const [chats, setChats] = useState([])
    const [avatar, setAvatar] = useState({
        file: null,
        url: ""
    })
    const [isChangingAvatar, setIsChangingAvatar] = useState(false)
    const {currentUser} = useUserStore()
    const { changeChat, chatId } = useChatStore()

    useEffect(() => {
        const unSub = onSnapshot(doc(db, "userChats", currentUser.uid), async (res) => {
            if (res.exists()) {
                const items = res.data().chats;

                const promises = items.map(async (item) => {
                    const userDocRef = doc(db, "users", item.receiverId);
                    const userDocSnap = await getDoc(userDocRef);
                    const user = userDocSnap.data();

                    return {...item, user}
                });

                const chatData = await Promise.all(promises);
                setChats(chatData.sort((a,b) => b.updatedAt - a.updatedAt));
            }
        });

        return () => {
            unSub()
        };
    }, [currentUser.uid]);

    // Загрузка изображения в Supabase Storage
    const uploadImage = async (file) => {
        if (!file) return null;
        
        const fileName = `${Date.now()}_${uuidv4()}`;
        
        try {
            const { data, error: uploadError } = await supabase
                .storage
                .from('avatars')
                .upload(fileName, file);
            
            if (uploadError) throw uploadError;
            
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
    }

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Сразу показываем превью
        setAvatar({
            file: file,
            url: URL.createObjectURL(file)
        });

        setIsChangingAvatar(true);
        
        try {
            const publicUrl = await uploadImage(file);
            if (publicUrl) {
                // Обновляем аватар в Firestore
                await updateDoc(doc(db, "users", currentUser.uid), {
                    avatar: publicUrl
                });
                
                toast.success("Avatar updated successfully!");
                
                // Обновляем локальное состояние
                setAvatar({
                    file: null,
                    url: publicUrl
                });
            }
        } catch (error) {
            console.error("Error updating avatar:", error);
            toast.error("Failed to update avatar");
        } finally {
            setIsChangingAvatar(false);
            
        }
    }

    const handleSelect = async (chat) => {
        const userChats = chats.map(item => {
            const{user, ...rest} = item;
            return rest
        })
        const chatIndex = userChats.findIndex(item => item.chatId === chat.chatId);

        userChats[chatIndex].isSeen = true;

        const userChatsRef = doc(db, "userChats", currentUser.uid);

        try {
            await updateDoc(userChatsRef, {chats: userChats});
            changeChat(chat.chatId, chat.user)
        } catch (error) {
            console.log(error);
        }
    }

const filteredChats = chats.filter((c) => c.user.username.toLowerCase().includes(inputValue.toLowerCase()));

    return (
        <div className='chatList'>
            <div className='userProfile'>
<div className='userProfile-flex'>
<label htmlFor="avatarChange" className="avatarLabel">
                    <img 
                        src={avatar.url || currentUser?.avatar || "./avatar.png"} 
                        alt="Profile" 
                        className="profileAvatar"
                    />
                    {isChangingAvatar ? (
                        <div className="avatarOverlay">Uploading...</div>
                    ) : (
                        <div className="avatarOverlay">Change Avatar</div>
                    )}
                </label>
                <input 
                    type="file" 
                    id="avatarChange" 
                    style={{display: "none"}} 
                    onChange={handleAvatarChange}
                    accept="image/*"
                    disabled={isChangingAvatar}
                />
                <div className="profileInfo">
                    <span className="profileName">{currentUser?.username || "User"}</span>
                    <span className="profileStatus">Online</span>
                </div>
</div>
                                <button className='logout' onClick={() => auth.signOut()}>Logout</button>
                
            </div>

            <div className='search'>
                <div className='searchBar'>
                    <input type="text" placeholder='Search chats...' onChange={(e) => setInputValue(e.target.value)}/>
                </div>
                <img 
                    src={addMode ? "./minus.png" : "./plus.png"} 
                    alt="" 
                    className='add'
                    onClick={() => setAddMode(!addMode)}
                />
            </div>
            
            {filteredChats.map((chat) => (
                <div 
                    className={`item ${chat.chatId === chatId ? 'active' : ''}`}
                    key={chat.chatId} 
                    onClick={() => handleSelect(chat)}
                    style={{
                        backgroundColor: chat?.isSeen ? "transparent" : "#27242F",
                    }}
                >
                    <img src={chat.user?.avatar || "./avatar.png"} alt="" />
                    <div className="texts">
                        <span>{chat.user?.username}</span>
                        <p>{chat.lastMessage || "No messages yet"}</p>
                    </div>
                </div>
            ))}
            
            {addMode && <AddUser onClose={() => setAddMode(false)} />}
        </div>
    )
}

export default ChatList