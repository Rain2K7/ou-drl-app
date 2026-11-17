import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc
} from 'firebase/firestore';
import { 
  Sparkles, 
  Award, 
  Save, 
  Image as ImageIcon, 
  LogOut, 
  LogIn, 
  RefreshCw, 
  Palette, 
  PlusCircle, 
  Trash2, 
  Paperclip,
  Eye,
  EyeOff,
  UserPlus,
  Bookmark,
  Heart,
  Calendar,
  Layers,
  ChevronRight,
  Download,
  X
} from 'lucide-react';

// --- FIREBASE INITIALIZATION ---
const firebaseConfig = {
  apiKey: "AIzaSyA6_FZejbBAHSTCeaypdDx9YDGsDywKIYc",
  authDomain: "rainer-88e5f.firebaseapp.com",
  projectId: "rainer-88e5f",
  storageBucket: "rainer-88e5f.firebasestorage.app",
  messagingSenderId: "878186322963",
  appId: "1:878186322963:web:4af21b06b144d1aa17f3e6",
  measurementId: "G-04EYBPBHY8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Giữ nguyên các biến DEFAULT_APP_BG, OU_CRITERIA_GROUPS, DEFAULT_CRITERIA_ITEMS, initializeDefaultSemesters ở đây...
// (Mình lược bớt phần này trong khung code để bạn dễ nhìn)

export default function App() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  const [authMssv, setAuthMssv] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authClass, setAuthClass] = useState('25DH1101');
  const [authMajor, setAuthMajor] = useState('Công Nghệ Thông Tin');
  const [showPassword, setShowPassword] = useState(false);

  const [showAutoFillModal, setShowAutoFillModal] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState([]);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // --- TRẠNG THÁI TỰ ĐỘNG LƯU ---
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const [studentInfo, setStudentInfo] = useState({
    name: 'Sinh Viên OU',
    mssv: '',
    class: '25DH1101',
    major: 'Công Nghệ Thông Tin',
    avatarUrl: ''
  });

  const [selectedYear, setSelectedYear] = useState(1);
  const [selectedSemester, setSelectedSemester] = useState(1);
  const currentSemKey = `Y${selectedYear}_S${selectedSemester}`;

  const [semestersData, setSemestersData] = useState(initializeDefaultSemesters());

  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  
  // --- CẬP NHẬT LẠI STATE CỦA NHIỆM VỤ ĐỂ CHỨA MẢNG ẢNH (evidences) ---
  const [newTask, setNewTask] = useState({
    title: '',
    groupId: 'g1',
    score: 5,
    date: new Date().toISOString().split('T')[0],
    note: '',
    evidences: [] // Mảng chứa tối đa 10 ảnh/file
  });

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBtn(false);
    }
    setDeferredPrompt(null);
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ou_saved_accounts_v3');
      if (stored) {
        setSavedAccounts(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
    });
    return () => unsubscribe();
  }, []);

  // --- TỰ ĐỘNG LƯU FIRESTORE (DEBOUNCE 1.5s) ---
  useEffect(() => {
    if (!isLoggedIn || !studentInfo.mssv) return;

    setIsAutoSaving(true);

    const timer = setTimeout(async () => {
      try {
        const userDocRef = doc(db, 'ou_users', studentInfo.mssv);
        await setDoc(userDocRef, {
          studentInfo,
          semestersData,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        
        setLastSaved(new Date().toLocaleTimeString());
      } catch (err) {
        console.error("Auto-save error:", err);
      } finally {
        setIsAutoSaving(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [studentInfo, semestersData, isLoggedIn]);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const saveAccountToLocal = (accountObj) => {
    setSavedAccounts(prev => {
      const filtered = prev.filter(a => a.mssv !== accountObj.mssv);
      const updated = [accountObj, ...filtered];
      localStorage.setItem('ou_saved_accounts_v3', JSON.stringify(updated));
      return updated;
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!authMssv || !authPassword || !authName) {
      showToast('Vui lòng nhập đầy đủ thông tin!', 'error');
      return;
    }

    if (authMssv.length < 8) {
      showToast('MSSV phải từ 8 ký tự trở lên!', 'error');
      return;
    }

    setLoading(true);
    try {
      const userDocRef = doc(db, 'ou_users', authMssv);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        showToast('⚠️ MSSV này đã được đăng ký! Vui lòng chuyển sang Đăng Nhập.', 'error');
        setLoading(false);
        return;
      }

      const initialInfo = {
        name: authName,
        mssv: authMssv,
        class: authClass,
        major: authMajor,
        avatarUrl: ''
      };

      const defaultSemData = initializeDefaultSemesters();

      await setDoc(userDocRef, {
        mssv: authMssv,
        password: authPassword,
        studentInfo: initialInfo,
        semestersData: defaultSemData,
        createdAt: new Date().toISOString()
      });

      saveAccountToLocal({
        mssv: authMssv,
        name: authName,
        class: authClass,
        pass: authPassword
      });

      setStudentInfo(initialInfo);
      setSemestersData(defaultSemData);
      setIsLoggedIn(true);
      showToast('🎉 Đăng ký tài khoản Cloud thành công!');
    } catch (err) {
      console.error("Register Error:", err);
      showToast('❌ Lỗi kết nối Firestore khi đăng ký!', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!authMssv || !authPassword) {
      showToast('Vui lòng nhập MSSV và Mật khẩu!', 'error');
      return;
    }

    setLoading(true);
    try {
      const userDocRef = doc(db, 'ou_users', authMssv);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        showToast('❌ Tài khoản chưa đăng ký trên app! Vui lòng chuyển sang Đăng Ký Mới.', 'error');
        setLoading(false);
        return;
      }

      const userData = docSnap.data();

      if (userData.password !== authPassword) {
        showToast('❌ Sai mật khẩu! Vui lòng kiểm tra lại.', 'error');
        setLoading(false);
        return;
      }

      if (userData.studentInfo) setStudentInfo(userData.studentInfo);
      if (userData.semestersData) setSemestersData(userData.semestersData);

      saveAccountToLocal({
        mssv: authMssv,
        name: userData.studentInfo?.name || 'Sinh Viên OU',
        class: userData.studentInfo?.class || '25DH1101',
        pass: authPassword
      });

      setIsLoggedIn(true);
      showToast('💖 Đăng nhập thành công! Dữ liệu Cloud đã tải nguyên vẹn.');
    } catch (err) {
      console.error("Login Error:", err);
      showToast('❌ Không thể kết nối với Firestore!', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAutoFillAccount = (acc) => {
    setAuthMssv(acc.mssv);
    setAuthPassword(acc.pass || '');
    if (acc.name) setAuthName(acc.name);
    setShowAutoFillModal(false);
    showToast(`✨ Đã tự động điền tài khoản ${acc.mssv}!`);
  };

  const handleDefaultScoreChange = (itemId, val) => {
    const numVal = Math.max(0, Number(val) || 0);
    setSemestersData(prev => {
      const sem = prev[currentSemKey] || {};
      return {
        ...prev,
        [currentSemKey]: {
          ...sem,
          scores: {
            ...(sem.scores || {}),
            [itemId]: numVal
          }
        }
      };
    });
  };

  // --- XỬ LÝ UPLOAD NHIỀU ẢNH (TỐI ĐA 10 ẢNH) ---
  const handleEvidenceFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Kiểm tra giới hạn 10 file
    if (newTask.evidences.length + files.length > 10) {
      showToast('Chỉ được đính kèm tối đa 10 ảnh/file minh chứng cho 1 nhiệm vụ!', 'error');
      e.target.value = null; // Reset input
      return;
    }

    // Đọc từng file
    let validFilesCount = 0;
    files.forEach(file => {
      // Giảm xuống 1MB để tránh vượt quá giới hạn 1MB của Firestore (Base64 phình to)
      if (file.size > 1 * 1024 * 1024) {
        showToast(`File ${file.name} vượt quá 1MB! Vui lòng chọn file nhẹ hơn.`, 'error');
        return;
      }

      validFilesCount++;
      const reader = new FileReader();
      reader.onloadend = () => {
        const isPdf = file.type === 'application/pdf';
        setNewTask(prev => ({
          ...prev,
          evidences: [...prev.evidences, {
            id: 'ev_' + Date.now() + Math.random(),
            name: file.name,
            data: reader.result,
            type: isPdf ? 'pdf' : 'image'
          }]
        }));
      };
      reader.readAsDataURL(file);
    });
    
    if (validFilesCount > 0) {
      showToast(`📄 Đã thêm ${validFilesCount} file đính kèm!`);
    }
    e.target.value = null; // Reset input để có thể chọn lại cùng file
  };

  // --- XÓA 1 ẢNH TRONG MODAL ---
  const handleRemoveEvidence = (evId) => {
    setNewTask(prev => ({
      ...prev,
      evidences: prev.evidences.filter(ev => ev.id !== evId)
    }));
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTask.title) {
      showToast('Vui lòng nhập tên nhiệm vụ!', 'error');
      return;
    }

    const taskItem = {
      id: 'custom_' + Date.now(),
      ...newTask,
      score: Number(newTask.score) || 0
    };

    setSemestersData(prev => {
      const sem = prev[currentSemKey] || { scores: {}, customTasks: [] };
      return {
        ...prev,
        [currentSemKey]: {
          ...sem,
          customTasks: [...(sem.customTasks || []), taskItem]
        }
      };
    });

    setShowAddTaskModal(false);
    // Reset form
    setNewTask({
      title: '',
      groupId: 'g1',
      score: 5,
      date: new Date().toISOString().split('T')[0],
      note: '',
      evidences: []
    });
    showToast('✨ Thêm nhiệm vụ & minh chứng thành công!');
  };

  const handleDeleteTask = (taskId) => {
    setSemestersData(prev => {
      const sem = prev[currentSemKey] || { customTasks: [] };
      return {
        ...prev,
        [currentSemKey]: {
          ...sem,
          customTasks: (sem.customTasks || []).filter(t => t.id !== taskId)
        }
      };
    });
    showToast('🗑️ Đã xóa nhiệm vụ!');
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStudentInfo(prev => ({ ...prev, avatarUrl: reader.result }));
        showToast('✨ Đã cập nhật Avatar!');
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateGroupTotals = (semKey) => {
    const sem = semestersData[semKey] || { scores: {}, customTasks: [] };
    const totals = {};

    OU_CRITERIA_GROUPS.forEach(g => {
      let sum = 0;
      DEFAULT_CRITERIA_ITEMS.filter(it => it.groupId === g.id).forEach(it => {
        sum += (sem.scores?.[it.id] || 0);
      });
      (sem.customTasks || []).filter(t => t.groupId === g.id).forEach(t => {
        sum += Number(t.score || 0);
      });
      totals[g.id] = sum;
    });

    return totals;
  };

  const calculateSemesterTotal = (semKey) => {
    const groupTotals = calculateGroupTotals(semKey);
    let total = 0;
    OU_CRITERIA_GROUPS.forEach(g => {
      total += Math.min(groupTotals[g.id] || 0, g.maxPoints);
    });
    return Math.min(100, Math.max(0, total));
  };

  const calculateYearAverage = (yearNum) => {
    const s1 = calculateSemesterTotal(`Y${yearNum}_S1`);
    const s2 = calculateSemesterTotal(`Y${yearNum}_S2`);
    const s3 = calculateSemesterTotal(`Y${yearNum}_S3`);
    return Math.round(((s1 + s2 + s3) / 3) * 10) / 10;
  };

  const calculateOverallAverage = () => {
    let sum = 0;
    YEARS.forEach(y => { sum += calculateYearAverage(y); });
    return Math.round((sum / 4) * 10) / 10;
  };

  const getGradeRank = (score) => {
    if (score >= 90) return { title: 'Xuất Sắc', color: 'text-pink-600 bg-pink-100 border-pink-300' };
    if (score >= 80) return { title: 'Tốt', color: 'text-purple-600 bg-purple-100 border-purple-300' };
    if (score >= 65) return { title: 'Khá', color: 'text-blue-600 bg-blue-100 border-blue-300' };
    if (score >= 50) return { title: 'Trung Bình', color: 'text-amber-600 bg-amber-100 border-amber-300' };
    return { title: 'Yếu / Kém', color: 'text-red-600 bg-red-100 border-red-300' };
  };

  const currentGroupTotals = calculateGroupTotals(currentSemKey);
  const currentSemesterScore = calculateSemesterTotal(currentSemKey);

  const bgStyle = {
    backgroundImage: `url(${DEFAULT_APP_BG})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed'
  };

  return (
    <div className="min-h-screen text-slate-800 font-sans relative transition-all duration-300 pb-20" style={bgStyle}>
      <div className="fixed inset-0 bg-white/60 backdrop-blur-[3px] pointer-events-none z-0"></div>

      {/* TOAST MESSAGE */}
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 animate-bounce ${
          toastMessage.type === 'error' ? 'bg-red-100 border-red-300 text-red-700' : 'bg-white/95 border-pink-300 text-pink-700'
        }`}>
          <Sparkles className="w-5 h-5 text-pink-400" />
          <span className="font-medium text-xs md:text-sm">{toastMessage.msg}</span>
        </div>
      )}

      {/* HEADER */}
      <header className="relative z-10 bg-white/85 backdrop-blur-md border-b border-pink-100 sticky top-0 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-400 to-yellow-300 flex items-center justify-center text-white shadow-md font-bold text-lg">
              OU
            </div>
            <div>
              <h1 className="font-bold text-pink-600 text-base md:text-lg flex items-center gap-1.5">
                ĐIỂM RÈN LUYỆN OU <Sparkles className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              </h1>
              <p className="text-xs text-slate-500">Trường Đại Học Mở TP.HCM • Hệ Thống Cloud</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {showInstallBtn && (
              <button
                onClick={handleInstallApp}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 hover:opacity-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-pink-200 transition active:scale-95 animate-pulse"
              >
                <Download className="w-4 h-4" /> Tải App
              </button>
            )}

            {isLoggedIn && (
              <>
                {/* TRẠNG THÁI TỰ ĐỘNG LƯU */}
                <div className="px-3.5 py-2 rounded-xl bg-white/70 border border-pink-200 text-xs font-semibold text-slate-600 flex items-center gap-1.5 shadow-sm min-w-[140px] justify-center">
                  {isAutoSaving ? (
                    <><RefreshCw className="w-3.5 h-3.5 animate-spin text-pink-500" /> Đang lưu...</>
                  ) : lastSaved ? (
                    <><Save className="w-3.5 h-3.5 text-green-500" /> Đã lưu lúc {lastSaved}</>
                  ) : (
                    <><Save className="w-3.5 h-3.5 text-slate-400" /> Sẵn sàng</>
                  )}
                </div>

                <button 
                  onClick={() => setIsLoggedIn(false)}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium flex items-center gap-1 transition"
                >
                  <LogOut className="w-4 h-4" /> Đăng xuất
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 mt-6">
        {!isLoggedIn ? (
          <div className="max-w-md mx-auto mt-6 bg-white/95 backdrop-blur-lg rounded-3xl p-6 md:p-8 border border-pink-100 shadow-2xl relative overflow-hidden">
            {/* ... (Phần form đăng nhập/đăng ký giữ nguyên) ... */}
            <div className="text-center mb-6 relative">
              <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-pink-300 via-pink-400 to-yellow-300 rounded-full flex items-center justify-center p-1 shadow-md mb-3">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                  <Heart className="w-9 h-9 text-pink-500 fill-pink-100" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-800">
                {authMode === 'login' ? 'Đăng Nhập Sinh Viên OU' : 'Đăng Ký Tài Khoản Cloud Mới'}
              </h2>
            </div>
            
            {/* Form đăng nhập ở đây, mình rút gọn để bạn dễ nhìn phần chính */}
            <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-3.5 relative">
              {/* Nội dung form giữ nguyên như file cũ của bạn */}
              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs md:text-sm shadow-lg shadow-pink-200 transition active:scale-95 flex items-center justify-center gap-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : authMode === 'login' ? 'Đăng Nhập' : 'Đăng Ký'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* CỘT TRÁI: THÔNG TIN CÁ NHÂN & DASHBOARD */}
            <div className="lg:col-span-1 space-y-6">
              {/* ... (Giữ nguyên phần Avatar và Dashboard) ... */}
            </div>

            {/* CỘT PHẢI: BẢNG TÍNH ĐIỂM CHI TIẾT */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-pink-100 shadow-xl flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    Bảng Điểm Rèn Luyện: Năm {selectedYear} - Học Kỳ {selectedSemester}
                  </h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-2xl font-black text-pink-600">{currentSemesterScore}</span>
                    <span className="text-xs font-semibold text-slate-400"> / 100 đ</span>
                  </div>
                  <button
                    onClick={() => setShowAddTaskModal(true)}
                    className="px-4 py-2.5 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-pink-200 transition active:scale-95"
                  >
                    <PlusCircle className="w-4 h-4" /> Thêm Nhiệm Vụ
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {OU_CRITERIA_GROUPS.map(group => {
                  const groupScore = currentGroupTotals[group.id] || 0;
                  const groupItems = DEFAULT_CRITERIA_ITEMS.filter(item => item.groupId === group.id);
                  const customItems = (semestersData[currentSemKey]?.customTasks || []).filter(t => t.groupId === group.id);

                  return (
                    <div key={group.id} className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-pink-100 shadow-lg">
                      <div className="flex justify-between items-center border-b border-pink-100 pb-3 mb-3">
                        <h3 className="font-bold text-slate-800 text-xs md:text-sm text-pink-600">
                          {group.title}
                        </h3>
                        <div className="text-xs font-extrabold text-slate-700 bg-pink-50 px-3 py-1 rounded-full border border-pink-200">
                          {Math.min(groupScore, group.maxPoints)} / {group.maxPoints} đ
                        </div>
                      </div>

                      <div className="space-y-3">
                        {/* Các item mặc định giữ nguyên... */}
                        {groupItems.map(item => {
                          const currentScore = semestersData[currentSemKey]?.scores?.[item.id] ?? (item.defaultChecked ? item.defaultScore : 0);
                          const isChecked = currentScore > 0;
                          return (
                            <div key={item.id} className="flex items-center justify-between gap-3 p-2.5 rounded-2xl hover:bg-pink-50/30 transition text-xs">
                              <div className="flex items-start gap-2.5 flex-1">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => handleDefaultScoreChange(item.id, e.target.checked ? item.defaultScore : 0)}
                                  className="mt-0.5 rounded border-pink-300 text-pink-500 w-4 h-4 cursor-pointer"
                                />
                                <span className={isChecked ? 'text-slate-800' : 'text-slate-400'}>{item.title}</span>
                              </div>
                            </div>
                          );
                        })}

                        {/* HIỂN THỊ NHIỆM VỤ VÀ CÁC ẢNH MINH CHỨNG ĐÃ LƯU */}
                        {customItems.map(task => {
                          // Tương thích ngược: Nếu có mảng evidences thì dùng, nếu có data cũ thì bọc lại thành mảng 1
                          const taskEvidences = task.evidences || (task.evidenceData ? [{ id: 'legacy', name: task.evidenceName, data: task.evidenceData, type: task.evidenceType }] : []);
                          
                          return (
                            <div key={task.id} className="flex flex-wrap items-start justify-between gap-3 p-3 rounded-2xl bg-amber-50/50 border border-amber-200/60 text-xs">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-800">{task.title}</span>
                                  <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">{task.date}</span>
                                </div>
                                {task.note && <p className="text-[11px] text-slate-500">{task.note}</p>}
                                
                                {/* HIỂN THỊ DANH SÁCH ẢNH MINH CHỨNG */}
                                {taskEvidences.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {taskEvidences.map((ev, idx) => (
                                      <a 
                                        key={ev.id || idx}
                                        href={ev.data} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="flex items-center gap-1 bg-white border border-pink-200 px-2 py-1 rounded-lg hover:bg-pink-50 text-[10px] text-pink-600 font-semibold shadow-sm"
                                      >
                                        <Paperclip className="w-3 h-3" /> 
                                        {ev.type === 'pdf' ? 'PDF' : 'Ảnh'} {idx + 1}
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="font-extrabold text-amber-600">+{task.score}đ</span>
                                <button onClick={() => handleDeleteTask(task.id)} className="text-slate-400 hover:text-red-500 p-1">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL THÊM NHIỆM VỤ */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-pink-100 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-pink-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-pink-500" /> Thêm Hoạt Động & Minh Chứng Mới
              </h3>
              <button onClick={() => setShowAddTaskModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tên hoạt động / Nhiệm vụ</label>
                <input
                  type="text"
                  placeholder="VD: Tham gia dọn dẹp vệ sinh khuôn viên OU"
                  value={newTask.title}
                  onChange={(e) => setNewTask(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-pink-200 text-xs focus:ring-2 focus:ring-pink-300 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nhóm Điều</label>
                  <select
                    value={newTask.groupId}
                    onChange={(e) => setNewTask(p => ({ ...p, groupId: e.target.value }))}
                    className="w-full px-2.5 py-2 rounded-xl border border-pink-200 text-xs font-medium"
                  >
                    {OU_CRITERIA_GROUPS.map(g => (
                      <option key={g.id} value={g.id}>{g.title.slice(0, 18)}...</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Điểm cộng</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newTask.score}
                    onChange={(e) => setNewTask(p => ({ ...p, score: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs font-bold text-pink-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ngày tham gia</label>
                <input
                  type="date"
                  value={newTask.date}
                  onChange={(e) => setNewTask(p => ({ ...p, date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs"
                />
              </div>

              {/* PHẦN UPLOAD NHIỀU ẢNH */}
              <div className="bg-pink-50/50 p-3 rounded-2xl border border-pink-100">
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Upload Minh Chứng (Tối đa 10 ảnh/PDF, mỗi file ≤ 1MB)
                </label>
                
                {/* Nút chọn file */}
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleEvidenceFileUpload}
                  disabled={newTask.evidences.length >= 10}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-pink-100 file:text-pink-700 hover:file:bg-pink-200 disabled:opacity-50"
                />
                
                {/* Danh sách ảnh đã chọn (Có nút X để xoá từng ảnh) */}
                {newTask.evidences.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
                    {newTask.evidences.map((ev, idx) => (
                      <div key={ev.id} className="relative group rounded-lg overflow-hidden border border-pink-200 bg-white aspect-square flex items-center justify-center">
                        {ev.type === 'image' ? (
                          <img src={ev.data} alt="evidence" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center text-pink-500">
                            <Paperclip className="w-4 h-4" />
                            <span className="text-[9px] font-bold mt-1">PDF</span>
                          </div>
                        )}
                        
                        {/* Nút Xoá Ảnh (hiện khi hover) */}
                        <button
                          type="button"
                          onClick={() => handleRemoveEvidence(ev.id)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition"
                        >
                          <X className="w-5 h-5 bg-red-500 rounded-full p-0.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-slate-400 mt-2 text-right">
                  Đã chọn: {newTask.evidences.length}/10 ảnh
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold shadow-md shadow-pink-200"
                >
                  Lưu Nhiệm Vụ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
