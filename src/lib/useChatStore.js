import { create } from 'zustand';
import { useUserStore } from './userStore';

export const useChatStore = create((set) => ({
chatId: null,
user: null,
isCurrentUserBlocked: false,
isReceiverBlocked: false,
changeChat: (chatId, user) => {
    const currentUser = useUserStore.getState().currentUser;

    // Проверяем, является ли пользователь заблокированным
   

        return set({
            chatId,
            user,
            isCurrentUserBlocked: false,
            isReceiverBlocked: false,
        })
       },

changeBlock: () => {
    set((state)=>({...state, isReceiverBlocked: !state.isReceiverBlocked}))
}
}))