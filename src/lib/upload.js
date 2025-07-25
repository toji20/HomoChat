import { useState } from "react";
import { supabase } from "./supabase";
import { v4 as uuidv4 } from 'uuid';

// ✅ Кастомный хук (начинается с use)
export function useGetMedia() {
  const [media, setMedia] = useState([]);

  const fetchMedia = async () => {
    const { data, error } = await supabase.storage.from('avatars').list(Date.now() + '/', {
      limit: 10,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' }
    });

    if (data) {
      setMedia(data);
    } else {
      console.error("Ошибка загрузки медиа:", error);
    }
  };

  return { media, fetchMedia };
}

// ✅ Обычная функция загрузки (без хуков)
export async function uploadImage(file) {

  const { data, error } = await supabase
    .storage
    .from('avatars')
    .upload(Date.now() + "/" + uuidv4(), file);

  if (error) {
    console.error("Ошибка загрузки:", error);
  }

  return data; // Можно вернуть результат загрузки
}