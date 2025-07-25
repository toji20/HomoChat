import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'
import { useChatStore } from '../../lib/useChatStore'
import { useUserStore } from '../../lib/userStore'
import './detail.css'


const Detail = () => {
  const {changeBlock,user, isCurrentUserBlocked, isReceiverBlocked} = useChatStore()
  const {currentUser} = useUserStore()

  const handleBlock = async () => {
    if (!user) return;
    const userDocRef = doc(db, "userChats", currentUser.uid);
    try {
      await updateDoc(userDocRef, {
        blocked: isReceiverBlocked ? arrayRemove(user.uid) : arrayUnion(user.uid),
      })
      changeBlock()
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className='detail'>
      <div className="user">
        <img src={user?.avatar || "./avatar.png"} alt="" />
        <h2>{user?.username}</h2>
        <p>Lorem ipsum dolor sit amet consectetur, adipisicing elit. </p>
      </div>
      <div className="info">
      <div className='option'>
          <div className="title">
            <span>Privacy Settings</span>
            <img src="./arrowUp.png" alt="" />
          </div>
        </div>
        <div className='option'>
          <div className="title">
            <span>Chat settings</span>
            <img src="./arrowUp.png" alt="" />
          </div>
        </div>
        <div className='option'>
          <div className="title">
            <span>Privacy and help</span>
            <img src="./arrowUp.png" alt="" />
          </div>
        </div>
        <div className='option'>
          <div className="title">
            <span>Shared Media</span>
            <img src="./arrowDown.png" alt="" />
          </div>
          <div className="photos">
          <div className="photoItem">
              <div className="photoDetail">
              <img src="./avatar.png" alt="" />
              <span>photo_2025-01-01.png</span>
              </div>
              <img src="./download.png" alt="" className='icon'/>
            </div>
            <div className="photoItem">
              <div className="photoDetail">
              <img src="./avatar.png" alt="" />
              <span>photo_2025-01-01.png</span>
              </div>
              <img src="./download.png" alt="" className='icon'/>
            </div>
            <div className="photoItem">
              <div className="photoDetail">
              <img src="./avatar.png" alt="" />
              <span>photo_2025-01-01.png</span>
              </div>
              <img src="./download.png" alt="" className='icon'/>
            </div>
          </div>
        </div>
        <div className='option'>
          <div className="title">
            <span>Shared Files</span>
            <img src="./arrowUp.png" alt="" />
          </div>
        </div>
        <button onClick={handleBlock}>
          {
            isCurrentUserBlocked ? "You are blocked" : isReceiverBlocked ? "Unblock user" : "Block user"
          }
        </button>
        <button className='logout' onClick={() => auth.signOut()}>Logout</button>
      </div>
    </div>
  )
}

export default Detail