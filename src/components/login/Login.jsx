import { useState } from 'react'
import './login.css'
import { toast } from 'react-toastify'
import {createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { supabase } from '../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';


const Login = () => {
    const [avatar, setAvatar] = useState({
        file: null,
        url:""
    })

    const [loading, setLoading] = useState(false)

    async function uploadImage(e) {
        const file = e.target.files[0];
        if (!file) return null;
        
        const fileName = `${Date.now()}_${uuidv4()}`; // Уникальное имя файла
        
        try {
            // 1. Загружаем файл в Supabase Storage
            const { data, error } = await supabase
                .storage
                .from('avatars')
                .upload(fileName, file);
            
            if (error) throw error;
            
            // 2. Получаем публичный URL
            const { data: { publicUrl } } = supabase
                .storage
                .from('avatars')
                .getPublicUrl(data.path);
            
            // 3. Обновляем состояние аватара
            setAvatar({
                file: file,
                url: publicUrl || URL.createObjectURL(file) // Fallback на локальный URL
            });
            
            return publicUrl; // Возвращаем публичный URL для сохранения в Firestore
            
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Failed to upload image");
            return null;
        }
    }
    
    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.target);
        const { username, email, password } = Object.fromEntries(formData);
        
        try {
            // 1. Регистрация в Firebase Auth
            const res = await createUserWithEmailAndPassword(auth, email, password);
            
            // 2. Загружаем аватар (если есть)
            let imgUrl = "./avatar.png"; // Дефолтный URL
            if (avatar.file) {
                // Передаем файл в uploadImage через искусственное событие
                const publicUrl = await uploadImage({
                    target: {
                        files: [avatar.file]
                    }
                });
                if (publicUrl) {
                    imgUrl = publicUrl; // Используем URL из Supabase
                }
            }
            
            // 3. Сохраняем данные в Firestore
            await setDoc(doc(db, "users", res.user.uid), {
                uid: res.user.uid,
                username,
                email,
                avatar: imgUrl, // URL из Supabase или дефолтный
                blockedUsers: [],
            });
            
            await setDoc(doc(db, "userChats", res.user.uid), {
                chats: [],
            });
            
            toast.success("Account created successfully!");
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };
    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.target);
        const { email, password } = Object.fromEntries(formData);
        try {

            await signInWithEmailAndPassword(auth, email, password)

        } catch (error) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }
    
  return (
    <div className='login'>
        <div className="item">
            <h2>Welcome back, </h2>
            <form onSubmit={handleLogin}>
                <input type="email" name='email' placeholder='Email' />
                <input type="password" name='password' placeholder='Password' />
                <button disabled={loading}>{loading ? "Loading..." : 'Sign In'}</button>
            </form>
        </div>
        <div className="separator"></div>
        <div className="item">
            <h2>Create an account</h2>
        <form onSubmit={handleRegister}>
            <label htmlFor="file">
                <img src={avatar.url || "./avatar.png"} alt="" />
                Upload an Image
                </label>
                <input type="file" id='file' name='file' style={{display: "none"}} onChange={uploadImage}/>
                <input type="text" placeholder='username' name='username'/>
                <input type="email" placeholder='Email' name='email'/>
                <input type="password" placeholder='Password' name='password'/>
                <button disabled={loading}>{loading ? "Loading..." : 'Sign Up'}</button>
            </form>
        </div>

    </div>
  )
}
export default Login