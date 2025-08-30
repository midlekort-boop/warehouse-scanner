let firebaseLoaded = false;
let firebaseLoading = false;

export const loadFirebase = () => {
  return new Promise((resolve, reject) => {
    if (firebaseLoaded) {
      resolve(firebase);
      return;
    }

    if (firebaseLoading) {
      // Если уже загружается, ждем завершения
      const checkLoaded = () => {
        if (firebaseLoaded) {
          resolve(firebase);
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
      return;
    }

    firebaseLoading = true;

    // Проверяем, загружены ли уже скрипты Firebase
    if (typeof firebase !== 'undefined' && typeof firebase.app !== 'undefined') {
      firebaseLoaded = true;
      firebaseLoading = false;
      resolve(firebase);
      return;
    }

    // Ждем полной загрузки Firebase
    const checkFirebase = () => {
      if (typeof firebase !== 'undefined' && typeof firebase.app !== 'undefined') {
        firebaseLoaded = true;
        firebaseLoading = false;
        resolve(firebase);
      } else {
        setTimeout(checkFirebase, 100);
      }
    };

    // Запускаем проверку
    setTimeout(checkFirebase, 100);
  });
};