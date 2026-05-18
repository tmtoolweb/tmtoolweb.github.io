const firebaseConfig = {
    apiKey: "AIzaSyBwvXHAWHy8af7uyuH0B62F07vYHYF7m8o",
    authDomain: "tmtool-firebase.firebaseapp.com",
    databaseURL: "https://tmtool-firebase-default-rtdb.asia-southeast1.firebasedatabase.app/",
    projectId: "tmtool-firebase",
    storageBucket: "tmtool-firebase.appspot.com",
    messagingSenderId: "367375494498",
    appId: "1:964035600880:web:9704a6b717ecd34ec3bd35"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Các biến trạng thái lưu tạm thời trong bộ nhớ máy
let loggedInUserEmail = "";
let targetOwner = "";
let globalCachedDevices = {};
let currentEditingId = null;
let activePhoneFilter = "";