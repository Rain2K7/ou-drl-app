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

// --- CÁC HẰNG SỐ CẤU HÌNH CỦA BẠN (KHÔI PHỤC LẠI) ---
const DEFAULT_APP_BG = "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80"; 
const YEARS = [1, 2, 3, 4];
const SEMESTERS = [1, 2, 3];

const OU_CRITERIA_GROUPS = [
  { id: 'g1', title: 'Điều 1. Ý thức học tập', maxPoints: 20 },
  { id: 'g2', title: 'Điều 2. Ý thức chấp hành quy chế', maxPoints: 25 },
  { id: 'g3', title: 'Điều 3. Hoạt động chính trị - xã hội', maxPoints: 20 },
  { id: 'g4', title: 'Điều 4. Phẩm chất đạo đức', maxPoints: 15 },
  { id: 'g5', title: 'Điều 5. Hoạt động tập thể', maxPoints: 20 },
];

const DEFAULT_CRITERIA_ITEMS = [
  { id: 'c1', groupId: 'g1', title: 'Tinh thần thái độ học tập, dự giờ, thi cử đầy đủ', defaultChecked: true, defaultScore: 5, isScoreInput: false, maxScore: 5 },
  { id: 'c2', groupId: 'g1', title: 'Tham gia CLB học thuật, NCKH, thi Olympic', defaultChecked: true, defaultScore: 5, isScoreInput: false, maxScore: 5 },
  { id: 'c3', groupId: 'g1', title: 'Kết quả học tập ĐTB (≥3.6: 10đ | ≥3.2: 8đ | ≥2.5: 6đ)', defaultChecked: true, defaultScore: 10, isScoreInput: true, maxScore: 10 },
  
  { id: 'c4', groupId: 'g2', title: 'Không vi phạm quy chế thi, nội quy trường', defaultChecked: true, defaultScore: 15, isScoreInput: false, maxScore: 15 },
  { id: 'c5', groupId: 'g2', title: 'Tham gia đầy đủ các buổi sinh hoạt lớp, khoa', defaultChecked: true, defaultScore: 10, isScoreInput: false, maxScore: 10 },
  
  { id: 'c6', groupId: 'g3', title: 'Tham gia các hoạt động tình nguyện, Mùa hè xanh', defaultChecked: true, defaultScore: 10, isScoreInput: false, maxScore: 10 },
  { id: 'c7', groupId: 'g3', title: 'Tham gia hiến máu nhân đạo', defaultChecked: false, defaultScore: 10, isScoreInput: false, maxScore: 10 },
  
  { id: 'c8', groupId: 'g4', title: 'Lối sống lành mạnh, giúp đỡ bạn bè', defaultChecked: true, defaultScore: 10, isScoreInput: false, maxScore: 10 },
  
  { id: 'c9', groupId: 'g5', title: 'Tham gia các hoạt động văn hóa, văn nghệ, thể thao', defaultChecked: true, defaultScore: 10, isScoreInput: false, maxScore: 10 }
];

const initializeDefaultSemesters = () => {
  const data = {};
  YEARS.forEach(y => {
    SEMESTERS.forEach(s => {
      data[`Y${y}_S${s}`] = { scores: {}, customTasks: [] };
    });
  });
  return data;
};

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

  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const [studentInfo, setStudentInfo] = useState({
    name: 'Sinh Viên OU', mssv: '', class: '25DH1101', major: 'Công Nghệ Thông Tin', avatarUrl: ''
  });

  const [selectedYear, setSelectedYear] = useState(1);
  const [selectedSemester, setSelectedSemester] = useState(1);
  const currentSemKey = `Y${selectedYear}_S${selectedSemester}`;

  const [semestersData, setSemestersData] = useState(initializeDefaultSemesters());

  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  
  const [newTask, setNewTask] = useState({
    title: '', groupId: 'g1', score: 5, date: new Date().toISOString().split('T')[0], note: '', evidences: []
  });

  useEffect(() => {
    const handleBeforeInstall = (e) => { e.preventDefault(); setDeferredPrompt(e); setShowInstallBtn(true); };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstallBtn(false);
    setDeferredPrompt(null);
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ou_saved_accounts_v3');
      if (stored) setSavedAccounts(JSON.parse(stored));
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error("Auth init error:", err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (usr) => setUser(usr));
    return () => unsubscribe();
  }, []);

  // --- TỰ ĐỘNG LƯU ---
  useEffect(() => {
    if (!isLoggedIn || !studentInfo.mssv) return;
    setIsAutoSaving(true);
    const timer = setTimeout(async () => {
      try {
        await setDoc(doc(db, 'ou_users', studentInfo.mssv), {
          studentInfo, semestersData, updatedAt: new Date().toISOString()
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
    if (!authMssv || !authPassword || !authName) return showToast('Vui lòng nhập đầy đủ thông tin!', 'error');
    if (authMssv.length < 8) return showToast('MSSV phải từ 8 ký tự!', 'error');
    
    setLoading(true);
    try {
      const userDocRef = doc(db, 'ou_users', authMssv);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) return showToast('⚠️ MSSV này đã được đăng ký!', 'error');

      const initialInfo = { name: authName, mssv: authMssv, class: authClass, major: authMajor, avatarUrl: '' };
      const defaultSemData = initializeDefaultSemesters();

      await setDoc(userDocRef, { mssv: authMssv, password: authPassword, studentInfo: initialInfo, semestersData: defaultSemData, createdAt: new Date().toISOString() });
      saveAccountToLocal({ mssv: authMssv, name: authName, class: authClass, pass: authPassword });
      setStudentInfo(initialInfo);
      setSemestersData(defaultSemData);
      setIsLoggedIn(true);
      showToast('🎉 Đăng ký thành công!');
    } catch (err) { showToast('❌ Lỗi kết nối!', 'error'); } finally { setLoading(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!authMssv || !authPassword) return showToast('Vui lòng nhập MSSV và Mật khẩu!', 'error');
    setLoading(true);
    try {
      const docSnap = await getDoc(doc(db, 'ou_users', authMssv));
      if (!docSnap.exists()) return showToast('❌ Tài khoản chưa đăng ký!', 'error');
      
      const userData = docSnap.data();
      if (userData.password !== authPassword) return showToast('❌ Sai mật khẩu!', 'error');

      if (userData.studentInfo) setStudentInfo(userData.studentInfo);
      if (userData.semestersData) setSemestersData(userData.semestersData);
      saveAccountToLocal({ mssv: authMssv, name: userData.studentInfo?.name || 'Sinh Viên OU', class: userData.studentInfo?.class || '25DH1101', pass: authPassword });
      setIsLoggedIn(true);
      showToast('💖 Đăng nhập thành công!');
    } catch (err) { showToast('❌ Không thể kết nối!', 'error'); } finally { setLoading(false); }
  };

  const handleSelectAutoFillAccount = (acc) => {
    setAuthMssv(acc.mssv); setAuthPassword(acc.pass || ''); if (acc.name) setAuthName(acc.name);
    setShowAutoFillModal(false); showToast(`✨ Đã điền tài khoản ${acc.mssv}!`);
  };

  const handleDefaultScoreChange = (itemId, val) => {
    setSemestersData(prev => {
      const sem = prev[currentSemKey] || {};
      return { ...prev, [currentSemKey]: { ...sem, scores: { ...(sem.scores || {}), [itemId]: Math.max(0, Number(val) || 0) } } };
    });
  };

  // --- UPLOAD NHIỀU ẢNH ---
  const handleEvidenceFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (newTask.evidences.length + files.length > 10) return showToast('Tối đa 10 ảnh/file!', 'error');

    let valid = 0;
    files.forEach(file => {
      if (file.size > 1 * 1024 * 1024) return showToast(`File ${file.name} > 1MB!`, 'error');
      valid++;
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewTask(prev => ({
          ...prev,
          evidences: [...prev.evidences, { id: 'ev_' + Date.now() + Math.random(), name: file.name, data: reader.result, type: file.type === 'application/pdf' ? 'pdf' : 'image' }]
        }));
      };
      reader.readAsDataURL(file);
    });
    if (valid > 0) showToast(`📄 Đã thêm ${valid} file!`);
    e.target.value = null;
  };

  const handleRemoveEvidence = (evId) => {
    setNewTask(prev => ({ ...prev, evidences: prev.evidences.filter(ev => ev.id !== evId) }));
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTask.title) return showToast('Vui lòng nhập tên nhiệm vụ!', 'error');
    const taskItem = { id: 'custom_' + Date.now(), ...newTask, score: Number(newTask.score) || 0 };
    setSemestersData(prev => {
      const sem = prev[currentSemKey] || { scores: {}, customTasks: [] };
      return { ...prev, [currentSemKey]: { ...sem, customTasks: [...(sem.customTasks || []), taskItem] } };
    });
    setShowAddTaskModal(false);
    setNewTask({ title: '', groupId: 'g1', score: 5, date: new Date().toISOString().split('T')[0], note: '', evidences: [] });
    showToast('✨ Thêm nhiệm vụ thành công!');
  };

  const handleDeleteTask = (taskId) => {
    setSemestersData(prev => {
      const sem = prev[currentSemKey] || { customTasks: [] };
      return { ...prev, [currentSemKey]: { ...sem, customTasks: (sem.customTasks || []).filter(t => t.id !== taskId) } };
    });
    showToast('🗑️ Đã xóa!');
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setStudentInfo(prev => ({ ...prev, avatarUrl: reader.result })); showToast('✨ Đã cập nhật Avatar!'); };
      reader.readAsDataURL(file);
    }
  };

  const calculateGroupTotals = (semKey) => {
    const sem = semestersData[semKey] || { scores: {}, customTasks: [] };
    const totals = {};
    OU_CRITERIA_GROUPS.forEach(g => {
      let sum = 0;
      DEFAULT_CRITERIA_ITEMS.filter(it => it.groupId === g.id).forEach(it => { sum += (sem.scores?.[it.id] || 0); });
      (sem.customTasks || []).filter(t => t.groupId === g.id).forEach(t => { sum += Number(t.score || 0); });
      totals[g.id] = sum;
    });
    return totals;
  };

  const calculateSemesterTotal = (semKey) => {
    const groupTotals = calculateGroupTotals(semKey);
    let total = 0;
    OU_CRITERIA_GROUPS.forEach(g => { total += Math.min(groupTotals[g.id] || 0, g.maxPoints); });
    return Math.min(100, Math.max(0, total));
  };

  const calculateYearAverage = (yearNum) => {
    return Math.round(((calculateSemesterTotal(`Y${yearNum}_S1`) + calculateSemesterTotal(`Y${yearNum}_S2`) + calculateSemesterTotal(`Y${yearNum}_S3`)) / 3) * 10) / 10;
  };

  const calculateOverallAverage = () => {
    let sum = 0; YEARS.forEach(y => { sum += calculateYearAverage(y); });
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

  return (
    <div className="min-h-screen text-slate-800 font-sans relative pb-20" style={{ backgroundImage: `url(${DEFAULT_APP_BG})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      <div className="fixed inset-0 bg-white/60 backdrop-blur-[3px] pointer-events-none z-0"></div>

      {toastMessage && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 animate-bounce ${toastMessage.type === 'error' ? 'bg-red-100 border-red-300 text-red-700' : 'bg-white/95 border-pink-300 text-pink-700'}`}>
          <Sparkles className="w-5 h-5 text-pink-400" />
          <span className="font-medium text-xs md:text-sm">{toastMessage.msg}</span>
        </div>
      )}

      <header className="relative z-10 bg-white/85 backdrop-blur-md border-b border-pink-100 sticky top-0 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-400 to-yellow-300 flex items-center justify-center text-white shadow-md font-bold text-lg">OU</div>
            <div>
              <h1 className="font-bold text-pink-600 text-base md:text-lg flex items-center gap-1.5">ĐIỂM RÈN LUYỆN OU <Sparkles className="w-4 h-4 text-yellow-400 fill-yellow-400" /></h1>
              <p className="text-xs text-slate-500">Trường Đại Học Mở TP.HCM • Hệ Thống Cloud</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {showInstallBtn && (
              <button onClick={handleInstallApp} className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 hover:opacity-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md animate-pulse">
                <Download className="w-4 h-4" /> Tải App
              </button>
            )}
            {isLoggedIn && (
              <>
                <div className="px-3.5 py-2 rounded-xl bg-white/70 border border-pink-200 text-xs font-semibold text-slate-600 flex items-center gap-1.5 shadow-sm min-w-[140px] justify-center">
                  {isAutoSaving ? <><RefreshCw className="w-3.5 h-3.5 animate-spin text-pink-500" /> Đang lưu...</> : lastSaved ? <><Save className="w-3.5 h-3.5 text-green-500" /> Đã lưu lúc {lastSaved}</> : <><Save className="w-3.5 h-3.5 text-slate-400" /> Sẵn sàng</>}
                </div>
                <button onClick={() => setIsLoggedIn(false)} className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium flex items-center gap-1">
                  <LogOut className="w-4 h-4" /> Đăng xuất
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 mt-6">
        {!isLoggedIn ? (
          <div className="max-w-md mx-auto mt-6 bg-white/95 backdrop-blur-lg rounded-3xl p-6 md:p-8 border border-pink-100 shadow-2xl relative overflow-hidden">
            <div className="text-center mb-6 relative">
              <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-pink-300 via-pink-400 to-yellow-300 rounded-full flex items-center justify-center p-1 shadow-md mb-3">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center"><Heart className="w-9 h-9 text-pink-500 fill-pink-100" /></div>
              </div>
              <h2 className="text-xl font-bold text-slate-800">{authMode === 'login' ? 'Đăng Nhập Sinh Viên OU' : 'Đăng Ký Tài Khoản Cloud'}</h2>
            </div>
            
            <div className="flex bg-pink-50/80 p-1 rounded-2xl mb-5 border border-pink-100">
              <button onClick={() => setAuthMode('login')} className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${authMode === 'login' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500'}`}>Đăng Nhập</button>
              <button onClick={() => setAuthMode('register')} className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${authMode === 'register' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500'}`}>Đăng Ký Mới</button>
            </div>

            <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-3.5 relative">
              {authMode === 'register' && (
                <>
                  <input type="text" value={authName} onChange={(e) => setAuthName(e.target.value)} placeholder="Họ và Tên" className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 text-xs" required />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={authClass} onChange={(e) => setAuthClass(e.target.value)} placeholder="Mã Lớp" className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs" />
                    <input type="text" value={authMajor} onChange={(e) => setAuthMajor(e.target.value)} placeholder="Ngành Học" className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs" />
                  </div>
                </>
              )}
              <input type="text" value={authMssv} onChange={(e) => setAuthMssv(e.target.value)} placeholder="Mã Số Sinh Viên" className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 text-xs font-bold" required />
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="Mật khẩu" className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-pink-200 text-xs" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-400">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              {savedAccounts.length > 0 && (
                <button type="button" onClick={() => setShowAutoFillModal(true)} className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-yellow-200 to-pink-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2">
                  <Bookmark className="w-4 h-4 text-pink-600" /> Tự Động Điền Tài Khoản
                </button>
              )}

              <button type="submit" disabled={loading} className="w-full py-3 rounded-2xl bg-pink-500 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : authMode === 'login' ? 'Đăng Nhập' : 'Tạo Tài Khoản'}
              </button>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-pink-100 shadow-xl text-center">
                <div className="relative w-24 h-24 mx-auto mb-3 group cursor-pointer">
                  <img src={studentInfo.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb"} alt="Avatar" className="w-full h-full object-cover rounded-full border-4 border-pink-200" />
                  <label className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center text-white text-[11px] opacity-0 group-hover:opacity-100 cursor-pointer">
                    <Palette className="w-5 h-5 mb-1" /> Đổi
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>
                </div>
                <h3 className="font-bold text-slate-800 text-base">{studentInfo.name}</h3>
                <p className="text-xs text-pink-600 font-extrabold mt-0.5">MSSV: {studentInfo.mssv}</p>
                <div className="mt-3 text-xs text-slate-500 bg-pink-50/50 p-2.5 rounded-2xl">
                  <p>Lớp: {studentInfo.class}</p>
                  <p>Ngành: {studentInfo.major}</p>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-pink-100 shadow-xl">
                <h3 className="font-bold text-slate-800 text-xs flex items-center gap-2 mb-3"><Award className="w-4 h-4 text-pink-500" /> DASHBOARD</h3>
                <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-400 to-yellow-300 text-white text-center mb-4">
                  <p className="text-[11px]">Điểm Trung Bình</p>
                  <div className="text-3xl font-black">{calculateOverallAverage()} <span className="text-sm font-normal">/ 100</span></div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white/90 backdrop-blur-md rounded-3xl p-4 border border-pink-100 shadow-xl flex flex-wrap items-center justify-between gap-4">
                <div className="flex bg-pink-50 p-1 rounded-2xl border border-pink-100">
                  {YEARS.map(y => <button key={y} onClick={() => setSelectedYear(y)} className={`px-3 py-1.5 text-xs font-bold rounded-xl ${selectedYear === y ? 'bg-pink-500 text-white' : 'text-slate-600'}`}>Năm {y}</button>)}
                </div>
                <div className="flex bg-yellow-50 p-1 rounded-2xl border border-yellow-100">
                  {SEMESTERS.map(s => <button key={s} onClick={() => setSelectedSemester(s)} className={`px-3 py-1.5 text-xs font-bold rounded-xl ${selectedSemester === s ? 'bg-amber-400 text-slate-900' : 'text-slate-600'}`}>HK {s}</button>)}
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-pink-100 shadow-xl flex flex-wrap justify-between items-center gap-4">
                <h2 className="text-base font-bold text-slate-800">Bảng Điểm: Năm {selectedYear} - HK {selectedSemester}</h2>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-2xl font-black text-pink-600">{currentSemesterScore}</span><span className="text-xs font-semibold text-slate-400"> / 100 đ</span>
                  </div>
                  <button onClick={() => setShowAddTaskModal(true)} className="px-4 py-2.5 rounded-2xl bg-pink-500 text-white text-xs font-bold flex items-center gap-2"><PlusCircle className="w-4 h-4" /> Thêm Nhiệm Vụ</button>
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
                        <h3 className="font-bold text-slate-800 text-xs md:text-sm text-pink-600">{group.title}</h3>
                        <div className="text-xs font-extrabold text-slate-700 bg-pink-50 px-3 py-1 rounded-full">{Math.min(groupScore, group.maxPoints)} / {group.maxPoints} đ</div>
                      </div>

                      <div className="space-y-3">
                        {groupItems.map(item => {
                          const currentScore = semestersData[currentSemKey]?.scores?.[item.id] ?? (item.defaultChecked ? item.defaultScore : 0);
                          return (
                            <div key={item.id} className="flex items-center justify-between gap-3 p-2.5 rounded-2xl hover:bg-pink-50/30 text-xs">
                              <div className="flex items-start gap-2.5 flex-1">
                                <input type="checkbox" checked={currentScore > 0} onChange={(e) => handleDefaultScoreChange(item.id, e.target.checked ? item.defaultScore : 0)} className="mt-0.5 rounded text-pink-500 w-4 h-4" />
                                <span className={currentScore > 0 ? 'text-slate-800' : 'text-slate-400'}>{item.title}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {item.isScoreInput ? (
                                  <input type="number" value={currentScore} onChange={(e) => handleDefaultScoreChange(item.id, e.target.value)} className="w-14 px-2 py-1 border border-pink-200 rounded-xl text-center font-bold text-pink-600" />
                                ) : (
                                  <span className="font-bold text-slate-600">+{item.defaultScore}đ</span>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {customItems.map(task => {
                          const taskEvidences = task.evidences || (task.evidenceData ? [{ id: 'legacy', name: task.evidenceName, data: task.evidenceData, type: task.evidenceType }] : []);
                          return (
                            <div key={task.id} className="flex flex-wrap items-start justify-between gap-3 p-3 rounded-2xl bg-amber-50/50 border border-amber-200/60 text-xs">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-800">{task.title}</span>
                                  <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">{task.date}</span>
                                </div>
                                {task.note && <p className="text-[11px] text-slate-500">{task.note}</p>}
                                {taskEvidences.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {taskEvidences.map((ev, idx) => (
                                      <a key={ev.id || idx} href={ev.data} target="_blank" rel="noreferrer" className="flex items-center gap-1 bg-white border border-pink-200 px-2 py-1 rounded-lg text-[10px] text-pink-600 font-semibold hover:bg-pink-50 shadow-sm">
                                        <Paperclip className="w-3 h-3" /> {ev.type === 'pdf' ? 'PDF' : 'Ảnh'} {idx + 1}
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-extrabold text-amber-600">+{task.score}đ</span>
                                <button onClick={() => handleDeleteTask(task.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
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

      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-pink-100 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-pink-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><PlusCircle className="w-4 h-4 text-pink-500" /> Thêm Nhiệm Vụ Mới</h3>
              <button onClick={() => setShowAddTaskModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3">
              <input type="text" placeholder="Tên hoạt động / Nhiệm vụ" value={newTask.title} onChange={(e) => setNewTask(p => ({ ...p, title: e.target.value }))} className="w-full px-3.5 py-2 rounded-xl border border-pink-200 text-xs" required />
              
              <div className="grid grid-cols-2 gap-2">
                <select value={newTask.groupId} onChange={(e) => setNewTask(p => ({ ...p, groupId: e.target.value }))} className="w-full px-2.5 py-2 rounded-xl border border-pink-200 text-xs">
                  {OU_CRITERIA_GROUPS.map(g => <option key={g.id} value={g.id}>{g.title.slice(0, 18)}...</option>)}
                </select>
                <input type="number" min="1" max="10" value={newTask.score} onChange={(e) => setNewTask(p => ({ ...p, score: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs font-bold text-pink-600" />
              </div>

              <input type="date" value={newTask.date} onChange={(e) => setNewTask(p => ({ ...p, date: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs" />

              <div className="bg-pink-50/50 p-3 rounded-2xl border border-pink-100">
                <label className="block text-xs font-semibold text-slate-600 mb-2">Minh Chứng (Max 10 file ≤ 1MB)</label>
                <input type="file" multiple accept="image/*,application/pdf" onChange={handleEvidenceFileUpload} disabled={newTask.evidences.length >= 10} className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-pink-100 file:text-pink-700" />
                
                {newTask.evidences.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
                    {newTask.evidences.map((ev) => (
                      <div key={ev.id} className="relative group rounded-lg overflow-hidden border border-pink-200 bg-white aspect-square flex items-center justify-center">
                        {ev.type === 'image' ? <img src={ev.data} alt="ev" className="w-full h-full object-cover" /> : <div className="text-center text-pink-500"><Paperclip className="w-4 h-4 mx-auto" /><span className="text-[9px] font-bold">PDF</span></div>}
                        <button type="button" onClick={() => handleRemoveEvidence(ev.id)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white"><X className="w-5 h-5 bg-red-500 rounded-full p-0.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-slate-400 mt-2 text-right">Đã chọn: {newTask.evidences.length}/10</p>
              </div>

              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setShowAddTaskModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">Hủy</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-pink-500 text-white text-xs font-bold shadow-md">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAutoFillModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-slate-800 text-xs">Chọn Tài Khoản</h3>
              <button onClick={() => setShowAutoFillModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {savedAccounts.map((acc, idx) => (
                <div key={idx} onClick={() => handleSelectAutoFillAccount(acc)} className="p-3 rounded-2xl bg-pink-50 hover:bg-pink-100 cursor-pointer flex justify-between">
                  <div><span className="font-bold text-slate-800 text-xs block">{acc.name}</span><span className="text-[11px] text-pink-600">MSSV: {acc.mssv}</span></div>
                  <ChevronRight className="w-4 h-4 text-pink-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
