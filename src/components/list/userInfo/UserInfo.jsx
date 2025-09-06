import { auth } from '../../../lib/firebase'
import { useUserStore } from '../../../lib/userStore'
import './userInfo.css'

const UserInfo = () => {
    const {currentUser, isLoading, fetchUserInfo} = useUserStore()
  
  return (
    <div className='userInfo'>
        <div className='user'>
            <img src={currentUser.avatar || "./avatar.png"} alt="" />
            <h2 className='username'>{currentUser.username}</h2>
        </div>
                <button className='logout' onClick={() => auth.signOut()}>Logout</button>
    
    </div>
  )
}

export default UserInfo