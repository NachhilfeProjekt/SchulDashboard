import { AppDispatch } from '../store/store';
import { getCurrentUser, getUserLocations } from '../services/api';
import { updateUser, setCurrentLocation } from '../store/authSlice';

export const initializeApp = async (dispatch: AppDispatch) => {
  try {
    const user = await getCurrentUser();
    const locations = await getUserLocations(user.id);
    
    dispatch(updateUser(user));
    
    if (locations.length > 0) {
      dispatch(setCurrentLocation(locations[0]));
    }
  } catch (error) {
    console.error('Error initializing app:', error);
  }
};