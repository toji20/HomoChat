import { useState } from 'react'
import './login.css'
import { toast } from 'react-toastify'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { supabase } from '../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

const Login = () => {
    const [avatar, setAvatar] = useState({
        file: null,
        url: ""
    })

    const [loading, setLoading] = useState(false)

    const uploadImage = async (file) => {
        if (!file) return null;
        
        const fileName = `${Date.now()}_${uuidv4()}`;
        
        try {
            // 1. Загружаем файл в Supabase Storage
            const { data, error: uploadError } = await supabase
                .storage
                .from('avatars')
                .upload(fileName, file);
            
            if (uploadError) throw uploadError;
            
            // 2. Получаем публичный URL
            const { data: { publicUrl } } = supabase
                .storage
                .from('avatars')
                .getPublicUrl(data.path);
            
            // 3. Обновляем состояние аватара
            setAvatar({
                file: file,
                url: publicUrl
            });
            
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
    }

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.target);
        const { username, email, password } = Object.fromEntries(formData);
        
        try {
            // 1. Регистрация в Firebase Auth
            const res = await createUserWithEmailAndPassword(auth, email, password);
            
            // 2. Небольшая задержка для синхронизации
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // 3. Загружаем аватар (если есть)
            let imgUrl = "./avatar.png";
            if (avatar.file) {
                const publicUrl = await uploadImage(avatar.file);
                if (publicUrl) {
                    imgUrl = publicUrl;
                }
            }
            
            // 4. Сохраняем данные в Firestore
            await setDoc(doc(db, "users", res.user.uid), {
                uid: res.user.uid,
                username: username.trim(),
                email: email.trim(),
                avatar: imgUrl,
                blockedUsers: [],
                createdAt: new Date(),
            });
            
            await setDoc(doc(db, "userChats", res.user.uid), {
                chats: [],
                lastUpdated: new Date(),
            });
            
            toast.success("Account created successfully!");
            
        } catch (error) {
            console.error("Registration error:", error);
            
            if (error.code === 'permission-denied') {
                toast.error("Database permissions error. Please check Firestore rules.");
            } else if (error.code === 'auth/email-already-in-use') {
                toast.error("Email already in use");
            } else if (error.code === 'auth/weak-password') {
                toast.error("Password should be at least 6 characters");
            } else {
                toast.error(error.message);
            }
            
        } finally {
            setLoading(false);
        }
    };

const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.target);
        const { email, password } = Object.fromEntries(formData);
        
        try {
            await signInWithEmailAndPassword(auth, email.trim(), password);
            toast.success("Logged in successfully!");
            
        } catch (error) {
            console.error("Login error:", error);
            
            if (error.code === 'auth/invalid-credential') {
                toast.error("Invalid email or password");
            } else if (error.code === 'auth/user-not-found') {
                toast.error("User not found");
            } else if (error.code === 'auth/wrong-password') {
                toast.error("Wrong password");
            } else {
                toast.error(error.message);
            }
            
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className='login'>
            <div className="item">
                <h2>Welcome back</h2>
                <form onSubmit={handleLogin}>
                    <input 
                        type="email" 
                        name='email' 
                        placeholder='Email' 
                        required 
                        disabled={loading}
                    />
                    <input 
                        type="password" 
                        name='password' 
                        placeholder='Password' 
                        required 
                        disabled={loading}
                        minLength={6}
                    />
                    <button disabled={loading}>
                        {loading ? "Loading..." : 'Sign In'}
                    </button>
                </form>
            </div>
            
            <div className="separator"></div>
            
            <div className="item">
                <h2>Create an account</h2>
                <form onSubmit={handleRegister}>
                    <label htmlFor="file">
                        <img src={avatar.url || "./avatar.png"} alt="Avatar" />
                        Upload an Image
                    </label>
                    <input 
                        type="file" 
                        id='file' 
                        name='file' 
                        style={{display: "none"}} 
                        onChange={handleAvatarChange}
                        accept="image/*"
                        disabled={loading}
                    />
                    <input 
                        type="text" 
                        placeholder='Username' 
                        name='username' 
                        required 
                        disabled={loading}
                        minLength={3}
                    />
                    <input 
                        type="email" 
                        placeholder='Email' 
                        name='email' 
                        required 
                        disabled={loading}
                    />
                    <input 
                        type="password" 
                        placeholder='Password' 
                        name='password' 
                        required 
                        disabled={loading}
                        minLength={6}
                    />
                    <button disabled={loading}>
                        {loading ? "Creating account..." : 'Sign Up'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default Login;