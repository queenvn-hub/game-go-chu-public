import { auditVocabularyBank } from './VocabularyAudit.js';

const TOPIC = (id, vi, en, idLabel) => Object.freeze({ id, labels: Object.freeze({ vi, en, id: idLabel }) });

export const GRADE5_TOPICS = Object.freeze([
  TOPIC('family', 'Gia đình', 'Family', 'Keluarga'),
  TOPIC('school', 'Trường học', 'School', 'Sekolah'),
  TOPIC('classroom', 'Lớp học', 'Classroom', 'Ruang kelas'),
  TOPIC('home', 'Sinh hoạt hằng ngày', 'Daily home life', 'Kehidupan di rumah'),
  TOPIC('clothes', 'Quần áo', 'Clothes', 'Pakaian'),
  TOPIC('body', 'Cơ thể', 'Body', 'Tubuh'),
  TOPIC('health', 'Sức khỏe', 'Health', 'Kesehatan'),
  TOPIC('animals', 'Động vật', 'Animals', 'Hewan'),
  TOPIC('pets', 'Thú cưng', 'Pets', 'Hewan peliharaan'),
  TOPIC('food', 'Đồ ăn', 'Food', 'Makanan'),
  TOPIC('drinks', 'Đồ uống', 'Drinks', 'Minuman'),
  TOPIC('colors', 'Màu sắc', 'Colors', 'Warna'),
  TOPIC('numbers', 'Số đếm', 'Numbers', 'Angka'),
  TOPIC('time', 'Thời gian', 'Time', 'Waktu'),
  TOPIC('calendar', 'Lịch và ngày', 'Calendar and dates', 'Kalender dan tanggal'),
  TOPIC('weather', 'Thời tiết', 'Weather', 'Cuaca'),
  TOPIC('nature', 'Thiên nhiên', 'Nature', 'Alam'),
  TOPIC('places', 'Địa điểm', 'Places', 'Tempat'),
  TOPIC('transport', 'Giao thông', 'Transport', 'Transportasi'),
  TOPIC('community', 'Cộng đồng', 'Community', 'Komunitas'),
  TOPIC('jobs', 'Nghề nghiệp', 'Jobs', 'Pekerjaan'),
  TOPIC('hobbies', 'Sở thích', 'Hobbies', 'Hobi'),
  TOPIC('sports', 'Thể thao', 'Sports', 'Olahraga'),
  TOPIC('actions', 'Hành động', 'Actions', 'Tindakan'),
  TOPIC('feelings', 'Cảm xúc', 'Feelings', 'Perasaan'),
  TOPIC('adjectives', 'Tính từ', 'Adjectives', 'Kata sifat'),
  TOPIC('house', 'Nhà cửa', 'House and furniture', 'Rumah dan perabot'),
  TOPIC('technology', 'Công nghệ', 'Technology', 'Teknologi'),
  TOPIC('safety', 'An toàn', 'Safety', 'Keselamatan'),
  TOPIC('environment', 'Môi trường', 'Environment', 'Lingkungan'),
  TOPIC('festivals', 'Lễ hội', 'Festivals', 'Perayaan'),
  TOPIC('travel', 'Du lịch', 'Travel', 'Perjalanan')
]);

// The base bank starts with twelve entries per topic; EXTRA_WORDS below completes
// every topic to twenty entries for the free beta: 32 x 20 = 640.
const WORDS = Object.freeze({
  family: [['mother', 'mẹ', 'mother', 'ibu'], ['father', 'bố', 'father', 'ayah'], ['parent', 'bố mẹ', 'parent', 'orang tua'], ['child', 'con', 'child', 'anak'], ['sister', 'chị em gái', 'sister', 'saudara perempuan'], ['brother', 'anh em trai', 'brother', 'saudara laki-laki'], ['grandmother', 'bà', 'grandmother', 'nenek'], ['grandfather', 'ông', 'grandfather', 'kakek'], ['cousin', 'anh chị em họ', 'cousin', 'sepupu'], ['aunt', 'cô hoặc dì', 'aunt', 'bibi'], ['uncle', 'chú hoặc cậu', 'uncle', 'paman'], ['family', 'gia đình', 'family', 'keluarga']],
  school: [['school', 'trường học', 'school', 'sekolah'], ['teacher', 'giáo viên', 'teacher', 'guru'], ['student', 'học sinh', 'student', 'siswa'], ['class', 'lớp học', 'class', 'kelas'], ['lesson', 'bài học', 'lesson', 'pelajaran'], ['book', 'sách', 'book', 'buku'], ['notebook', 'vở', 'notebook', 'buku catatan'], ['pen', 'bút mực', 'pen', 'pulpen'], ['pencil', 'bút chì', 'pencil', 'pensil'], ['ruler', 'thước kẻ', 'ruler', 'penggaris'], ['homework', 'bài tập về nhà', 'homework', 'pekerjaan rumah'], ['library', 'thư viện', 'library', 'perpustakaan']],
  classroom: [['desk', 'bàn học', 'desk', 'meja belajar'], ['chair', 'ghế', 'chair', 'kursi'], ['board', 'bảng', 'board', 'papan tulis'], ['door', 'cửa', 'door', 'pintu'], ['window', 'cửa sổ', 'window', 'jendela'], ['bag', 'cặp sách', 'bag', 'tas'], ['map', 'bản đồ', 'map', 'peta'], ['picture', 'bức tranh', 'picture', 'gambar'], ['computer', 'máy tính', 'computer', 'komputer'], ['eraser', 'cục tẩy', 'eraser', 'penghapus'], ['crayon', 'bút sáp', 'crayon', 'krayon'], ['clock', 'đồng hồ', 'clock', 'jam']],
  home: [['wake', 'thức dậy', 'wake', 'bangun'], ['wash', 'rửa', 'wash', 'mencuci'], ['brush', 'chải hoặc đánh', 'brush', 'menyikat'], ['dress', 'mặc quần áo', 'dress', 'berpakaian'], ['breakfast', 'bữa sáng', 'breakfast', 'sarapan'], ['lunch', 'bữa trưa', 'lunch', 'makan siang'], ['dinner', 'bữa tối', 'dinner', 'makan malam'], ['sleep', 'ngủ', 'sleep', 'tidur'], ['cook', 'nấu ăn', 'cook', 'memasak'], ['clean', 'dọn dẹp', 'clean', 'membersihkan'], ['help', 'giúp đỡ', 'help', 'membantu'], ['familytime', 'giờ sinh hoạt gia đình', 'family time', 'waktu keluarga']],
  clothes: [['shirt', 'áo sơ mi', 'shirt', 'kemeja'], ['trousers', 'quần dài', 'trousers', 'celana panjang'], ['skirt', 'váy', 'skirt', 'rok'], ['dress', 'váy liền', 'dress', 'gaun'], ['shoes', 'giày', 'shoes', 'sepatu'], ['socks', 'tất', 'socks', 'kaus kaki'], ['hat', 'mũ', 'hat', 'topi'], ['coat', 'áo khoác dài', 'coat', 'mantel'], ['jacket', 'áo khoác', 'jacket', 'jaket'], ['uniform', 'đồng phục', 'uniform', 'seragam'], ['pocket', 'túi áo', 'pocket', 'saku'], ['button', 'cúc áo', 'button', 'kancing']],
  body: [['head', 'đầu', 'head', 'kepala'], ['hair', 'tóc', 'hair', 'rambut'], ['face', 'mặt', 'face', 'wajah'], ['eye', 'mắt', 'eye', 'mata'], ['ear', 'tai', 'ear', 'telinga'], ['nose', 'mũi', 'nose', 'hidung'], ['mouth', 'miệng', 'mouth', 'mulut'], ['hand', 'bàn tay', 'hand', 'tangan'], ['arm', 'cánh tay', 'arm', 'lengan'], ['leg', 'chân', 'leg', 'kaki'], ['foot', 'bàn chân', 'foot', 'telapak kaki'], ['tooth', 'răng', 'tooth', 'gigi']],
  health: [['doctor', 'bác sĩ', 'doctor', 'dokter'], ['nurse', 'y tá', 'nurse', 'perawat'], ['hospital', 'bệnh viện', 'hospital', 'rumah sakit'], ['medicine', 'thuốc', 'medicine', 'obat'], ['healthy', 'khỏe mạnh', 'healthy', 'sehat'], ['sick', 'ốm', 'sick', 'sakit'], ['pain', 'cơn đau', 'pain', 'rasa sakit'], ['cough', 'ho', 'cough', 'batuk'], ['fever', 'sốt', 'fever', 'demam'], ['rest', 'nghỉ ngơi', 'rest', 'istirahat'], ['exercise', 'tập thể dục', 'exercise', 'olahraga'], ['dentist', 'nha sĩ', 'dentist', 'dokter gigi']],
  animals: [['dog', 'chó', 'dog', 'anjing'], ['cat', 'mèo', 'cat', 'kucing'], ['bird', 'chim', 'bird', 'burung'], ['fish', 'cá', 'fish', 'ikan'], ['cow', 'bò', 'cow', 'sapi'], ['horse', 'ngựa', 'horse', 'kuda'], ['chicken', 'gà', 'chicken', 'ayam'], ['duck', 'vịt', 'duck', 'bebek'], ['rabbit', 'thỏ', 'rabbit', 'kelinci'], ['tiger', 'hổ', 'tiger', 'harimau'], ['elephant', 'voi', 'elephant', 'gajah'], ['monkey', 'khỉ', 'monkey', 'monyet']],
  pets: [['pet', 'thú cưng', 'pet', 'hewan peliharaan'], ['puppy', 'chó con', 'puppy', 'anak anjing'], ['kitten', 'mèo con', 'kitten', 'anak kucing'], ['cage', 'cái lồng', 'cage', 'kandang'], ['feed', 'cho ăn', 'feed', 'memberi makan'], ['walk', 'đi dạo', 'walk', 'berjalan'], ['tail', 'đuôi', 'tail', 'ekor'], ['fur', 'lông thú', 'fur', 'bulu'], ['cute', 'dễ thương', 'cute', 'lucu'], ['care', 'chăm sóc', 'care', 'merawat'], ['owner', 'chủ nuôi', 'owner', 'pemilik'], ['vet', 'bác sĩ thú y', 'vet', 'dokter hewan']],
  food: [['rice', 'cơm', 'rice', 'nasi'], ['bread', 'bánh mì', 'bread', 'roti'], ['egg', 'trứng', 'egg', 'telur'], ['meat', 'thịt', 'meat', 'daging'], ['soup', 'súp', 'soup', 'sup'], ['vegetable', 'rau', 'vegetable', 'sayur'], ['fruit', 'trái cây', 'fruit', 'buah'], ['apple', 'táo', 'apple', 'apel'], ['banana', 'chuối', 'banana', 'pisang'], ['orange', 'cam', 'orange', 'jeruk'], ['cake', 'bánh ngọt', 'cake', 'kue'], ['noodle', 'mì', 'noodle', 'mi']],
  drinks: [['water', 'nước', 'water', 'air'], ['milk', 'sữa', 'milk', 'susu'], ['juice', 'nước ép', 'juice', 'jus'], ['tea', 'trà', 'tea', 'teh'], ['coffee', 'cà phê', 'coffee', 'kopi'], ['lemonade', 'nước chanh', 'lemonade', 'limun'], ['bottle', 'chai', 'bottle', 'botol'], ['cup', 'cốc', 'cup', 'cangkir'], ['glass', 'ly thủy tinh', 'glass', 'gelas'], ['thirsty', 'khát', 'thirsty', 'haus'], ['drink', 'đồ uống', 'drink', 'minuman'], ['breakfast', 'bữa sáng', 'breakfast', 'sarapan']],
  colors: [['red', 'đỏ', 'red', 'merah'], ['blue', 'xanh dương', 'blue', 'biru'], ['green', 'xanh lá', 'green', 'hijau'], ['yellow', 'vàng', 'yellow', 'kuning'], ['black', 'đen', 'black', 'hitam'], ['white', 'trắng', 'white', 'putih'], ['brown', 'nâu', 'brown', 'cokelat'], ['purple', 'tím', 'purple', 'ungu'], ['pink', 'hồng', 'pink', 'merah muda'], ['orange', 'cam', 'orange', 'jingga'], ['gray', 'xám', 'gray', 'abu-abu'], ['color', 'màu sắc', 'color', 'warna']],
  numbers: [['zero', 'không', 'zero', 'nol'], ['one', 'một', 'one', 'satu'], ['two', 'hai', 'two', 'dua'], ['three', 'ba', 'three', 'tiga'], ['four', 'bốn', 'four', 'empat'], ['five', 'năm', 'five', 'lima'], ['six', 'sáu', 'six', 'enam'], ['seven', 'bảy', 'seven', 'tujuh'], ['eight', 'tám', 'eight', 'delapan'], ['nine', 'chín', 'nine', 'sembilan'], ['ten', 'mười', 'ten', 'sepuluh'], ['number', 'con số', 'number', 'angka']],
  time: [['morning', 'buổi sáng', 'morning', 'pagi'], ['afternoon', 'buổi chiều', 'afternoon', 'sore'], ['evening', 'buổi tối', 'evening', 'petang'], ['night', 'ban đêm', 'night', 'malam'], ['today', 'hôm nay', 'today', 'hari ini'], ['tomorrow', 'ngày mai', 'tomorrow', 'besok'], ['yesterday', 'hôm qua', 'yesterday', 'kemarin'], ['hour', 'giờ', 'hour', 'jam'], ['minute', 'phút', 'minute', 'menit'], ['oclock', 'giờ đúng', "o'clock", 'pukul'], ['early', 'sớm', 'early', 'lebih awal'], ['late', 'muộn', 'late', 'terlambat']],
  calendar: [['day', 'ngày', 'day', 'hari'], ['week', 'tuần', 'week', 'minggu'], ['month', 'tháng', 'month', 'bulan'], ['year', 'năm', 'year', 'tahun'], ['monday', 'thứ Hai', 'Monday', 'Senin'], ['tuesday', 'thứ Ba', 'Tuesday', 'Selasa'], ['wednesday', 'thứ Tư', 'Wednesday', 'Rabu'], ['thursday', 'thứ Năm', 'Thursday', 'Kamis'], ['friday', 'thứ Sáu', 'Friday', 'Jumat'], ['saturday', 'thứ Bảy', 'Saturday', 'Sabtu'], ['sunday', 'Chủ nhật', 'Sunday', 'Minggu'], ['date', 'ngày tháng', 'date', 'tanggal']],
  weather: [['sunny', 'có nắng', 'sunny', 'cerah'], ['rainy', 'có mưa', 'rainy', 'hujan'], ['cloudy', 'nhiều mây', 'cloudy', 'berawan'], ['windy', 'nhiều gió', 'windy', 'berangin'], ['snowy', 'có tuyết', 'snowy', 'bersalju'], ['hot', 'nóng', 'hot', 'panas'], ['cold', 'lạnh', 'cold', 'dingin'], ['warm', 'ấm', 'warm', 'hangat'], ['cool', 'mát', 'cool', 'sejuk'], ['storm', 'bão', 'storm', 'badai'], ['weather', 'thời tiết', 'weather', 'cuaca'], ['umbrella', 'ô dù', 'umbrella', 'payung']],
  nature: [['sun', 'mặt trời', 'sun', 'matahari'], ['moon', 'mặt trăng', 'moon', 'bulan'], ['star', 'ngôi sao', 'star', 'bintang'], ['sky', 'bầu trời', 'sky', 'langit'], ['cloud', 'đám mây', 'cloud', 'awan'], ['rain', 'mưa', 'rain', 'hujan'], ['wind', 'gió', 'wind', 'angin'], ['tree', 'cây', 'tree', 'pohon'], ['flower', 'hoa', 'flower', 'bunga'], ['river', 'sông', 'river', 'sungai'], ['mountain', 'núi', 'mountain', 'gunung'], ['sea', 'biển', 'sea', 'laut']],
  places: [['home', 'nhà', 'home', 'rumah'], ['school', 'trường học', 'school', 'sekolah'], ['market', 'chợ', 'market', 'pasar'], ['park', 'công viên', 'park', 'taman'], ['city', 'thành phố', 'city', 'kota'], ['village', 'làng', 'village', 'desa'], ['beach', 'bãi biển', 'beach', 'pantai'], ['shop', 'cửa hàng', 'shop', 'toko'], ['room', 'phòng', 'room', 'kamar'], ['road', 'con đường', 'road', 'jalan'], ['lake', 'hồ', 'lake', 'danau'], ['museum', 'bảo tàng', 'museum', 'museum']],
  transport: [['car', 'ô tô', 'car', 'mobil'], ['bus', 'xe buýt', 'bus', 'bus'], ['train', 'tàu hỏa', 'train', 'kereta'], ['plane', 'máy bay', 'plane', 'pesawat'], ['boat', 'thuyền', 'boat', 'perahu'], ['bike', 'xe đạp', 'bike', 'sepeda'], ['bicycle', 'xe đạp', 'bicycle', 'sepeda'], ['taxi', 'taxi', 'taxi', 'taksi'], ['station', 'nhà ga', 'station', 'stasiun'], ['airport', 'sân bay', 'airport', 'bandara'], ['ticket', 'vé', 'ticket', 'tiket'], ['travel', 'du lịch', 'travel', 'bepergian']],
  community: [['street', 'phố', 'street', 'jalan'], ['bridge', 'cây cầu', 'bridge', 'jembatan'], ['bank', 'ngân hàng', 'bank', 'bank'], ['postoffice', 'bưu điện', 'post office', 'kantor pos'], ['police', 'cảnh sát', 'police', 'polisi'], ['community', 'cộng đồng', 'community', 'komunitas'], ['playground', 'sân chơi', 'playground', 'taman bermain'], ['farm', 'nông trại', 'farm', 'peternakan'], ['town', 'thị trấn', 'town', 'kota kecil'], ['neighbor', 'hàng xóm', 'neighbor', 'tetangga'], ['firestation', 'trạm cứu hỏa', 'fire station', 'pemadam kebakaran'], ['busstop', 'trạm xe buýt', 'bus stop', 'halte bus']],
  jobs: [['doctor', 'bác sĩ', 'doctor', 'dokter'], ['teacher', 'giáo viên', 'teacher', 'guru'], ['farmer', 'nông dân', 'farmer', 'petani'], ['driver', 'tài xế', 'driver', 'sopir'], ['policeofficer', 'cảnh sát viên', 'police officer', 'polisi'], ['nurse', 'y tá', 'nurse', 'perawat'], ['cook', 'đầu bếp', 'cook', 'koki'], ['artist', 'nghệ sĩ', 'artist', 'seniman'], ['singer', 'ca sĩ', 'singer', 'penyanyi'], ['worker', 'công nhân', 'worker', 'pekerja'], ['pilot', 'phi công', 'pilot', 'pilot'], ['job', 'công việc', 'job', 'pekerjaan']],
  hobbies: [['read', 'đọc', 'read', 'membaca'], ['draw', 'vẽ', 'draw', 'menggambar'], ['sing', 'hát', 'sing', 'bernyanyi'], ['dance', 'nhảy', 'dance', 'menari'], ['swim', 'bơi', 'swim', 'berenang'], ['play', 'chơi', 'play', 'bermain'], ['collect', 'sưu tầm', 'collect', 'mengoleksi'], ['watch', 'xem', 'watch', 'menonton'], ['listen', 'nghe', 'listen', 'mendengarkan'], ['make', 'làm hoặc chế tạo', 'make', 'membuat'], ['photo', 'ảnh', 'photo', 'foto'], ['hobby', 'sở thích', 'hobby', 'hobi']],
  sports: [['football', 'bóng đá', 'football', 'sepak bola'], ['basketball', 'bóng rổ', 'basketball', 'bola basket'], ['tennis', 'quần vợt', 'tennis', 'tenis'], ['badminton', 'cầu lông', 'badminton', 'bulu tangkis'], ['volleyball', 'bóng chuyền', 'volleyball', 'bola voli'], ['running', 'chạy bộ', 'running', 'lari'], ['jumping', 'nhảy', 'jumping', 'melompat'], ['cycling', 'đạp xe', 'cycling', 'bersepeda'], ['swimming', 'bơi lội', 'swimming', 'berenang'], ['skating', 'trượt patin', 'skating', 'berseluncur'], ['team', 'đội', 'team', 'tim'], ['ball', 'quả bóng', 'ball', 'bola']],
  actions: [['go', 'đi', 'go', 'pergi'], ['come', 'đến', 'come', 'datang'], ['eat', 'ăn', 'eat', 'makan'], ['drink', 'uống', 'drink', 'minum'], ['read', 'đọc', 'read', 'membaca'], ['write', 'viết', 'write', 'menulis'], ['speak', 'nói', 'speak', 'berbicara'], ['listen', 'nghe', 'listen', 'mendengarkan'], ['look', 'nhìn', 'look', 'melihat'], ['open', 'mở', 'open', 'membuka'], ['close', 'đóng', 'close', 'menutup'], ['help', 'giúp', 'help', 'membantu']],
  feelings: [['happy', 'vui', 'happy', 'senang'], ['sad', 'buồn', 'sad', 'sedih'], ['angry', 'tức giận', 'angry', 'marah'], ['tired', 'mệt', 'tired', 'lelah'], ['hungry', 'đói', 'hungry', 'lapar'], ['thirsty', 'khát', 'thirsty', 'haus'], ['afraid', 'sợ hãi', 'afraid', 'takut'], ['excited', 'hào hứng', 'excited', 'bersemangat'], ['worried', 'lo lắng', 'worried', 'khawatir'], ['proud', 'tự hào', 'proud', 'bangga'], ['bored', 'chán', 'bored', 'bosan'], ['kind', 'tốt bụng', 'kind', 'baik hati']],
  adjectives: [['big', 'to', 'big', 'besar'], ['small', 'nhỏ', 'small', 'kecil'], ['long', 'dài', 'long', 'panjang'], ['short', 'ngắn', 'short', 'pendek'], ['tall', 'cao', 'tall', 'tinggi'], ['young', 'trẻ', 'young', 'muda'], ['old', 'già hoặc cũ', 'old', 'tua atau lama'], ['good', 'tốt', 'good', 'baik'], ['bad', 'xấu', 'bad', 'buruk'], ['fast', 'nhanh', 'fast', 'cepat'], ['slow', 'chậm', 'slow', 'lambat'], ['clean', 'sạch', 'clean', 'bersih']],
  house: [['apartment', 'căn hộ', 'apartment', 'apartemen'], ['building', 'tòa nhà', 'building', 'gedung'], ['address', 'địa chỉ', 'address', 'alamat'], ['stairs', 'cầu thang', 'stairs', 'tangga'], ['balcony', 'ban công', 'balcony', 'balkon'], ['sofa', 'ghế sofa', 'sofa', 'sofa'], ['table', 'cái bàn', 'table', 'meja'], ['key', 'chìa khóa', 'key', 'kunci'], ['roof', 'mái nhà', 'roof', 'atap'], ['wall', 'bức tường', 'wall', 'dinding'], ['floor', 'sàn nhà', 'floor', 'lantai'], ['lamp', 'đèn', 'lamp', 'lampu']],
  technology: [['phone', 'điện thoại', 'phone', 'telepon'], ['tablet', 'máy tính bảng', 'tablet', 'tablet'], ['screen', 'màn hình', 'screen', 'layar'], ['keyboard', 'bàn phím', 'keyboard', 'papan ketik'], ['mouse', 'chuột máy tính', 'mouse', 'tetikus'], ['internet', 'mạng internet', 'internet', 'internet'], ['website', 'trang web', 'website', 'situs web'], ['email', 'thư điện tử', 'email', 'surel'], ['camera', 'máy ảnh', 'camera', 'kamera'], ['video', 'video', 'video', 'video'], ['game', 'trò chơi', 'game', 'permainan'], ['robot', 'rô-bốt', 'robot', 'robot']],
  safety: [['safe', 'an toàn', 'safe', 'aman'], ['danger', 'nguy hiểm', 'danger', 'bahaya'], ['rule', 'quy tắc', 'rule', 'aturan'], ['helmet', 'mũ bảo hiểm', 'helmet', 'helm'], ['careful', 'cẩn thận', 'careful', 'hati-hati'], ['stop', 'dừng lại', 'stop', 'berhenti'], ['wait', 'chờ đợi', 'wait', 'menunggu'], ['cross', 'băng qua', 'cross', 'menyeberang'], ['emergency', 'khẩn cấp', 'emergency', 'darurat'], ['fire', 'lửa', 'fire', 'api'], ['protect', 'bảo vệ', 'protect', 'melindungi'], ['signal', 'tín hiệu', 'signal', 'sinyal']],
  environment: [['earth', 'Trái đất', 'earth', 'bumi'], ['air', 'không khí', 'air', 'udara'], ['water', 'nước', 'water', 'air'], ['land', 'đất đai', 'land', 'tanah'], ['forest', 'rừng', 'forest', 'hutan'], ['animal', 'động vật', 'animal', 'hewan'], ['plant', 'cây cối', 'plant', 'tanaman'], ['recycle', 'tái chế', 'recycle', 'mendaur ulang'], ['trash', 'rác', 'trash', 'sampah'], ['clean', 'sạch', 'clean', 'bersih'], ['protect', 'bảo vệ', 'protect', 'melindungi'], ['energy', 'năng lượng', 'energy', 'energi']],
  festivals: [['holiday', 'kỳ nghỉ', 'holiday', 'liburan'], ['festival', 'lễ hội', 'festival', 'festival'], ['birthday', 'sinh nhật', 'birthday', 'ulang tahun'], ['gift', 'món quà', 'gift', 'hadiah'], ['cake', 'bánh kem', 'cake', 'kue'], ['party', 'bữa tiệc', 'party', 'pesta'], ['song', 'bài hát', 'song', 'lagu'], ['dance', 'điệu nhảy', 'dance', 'tarian'], ['family', 'gia đình', 'family', 'keluarga'], ['lantern', 'đèn lồng', 'lantern', 'lentera'], ['flower', 'bông hoa', 'flower', 'bunga'], ['celebrate', 'ăn mừng', 'celebrate', 'merayakan']],
  travel: [['trip', 'chuyến đi', 'trip', 'perjalanan'], ['map', 'bản đồ', 'map', 'peta'], ['place', 'nơi chốn', 'place', 'tempat'], ['hotel', 'khách sạn', 'hotel', 'hotel'], ['bag', 'túi', 'bag', 'tas'], ['passport', 'hộ chiếu', 'passport', 'paspor'], ['train', 'tàu hỏa', 'train', 'kereta'], ['plane', 'máy bay', 'plane', 'pesawat'], ['beach', 'bãi biển', 'beach', 'pantai'], ['visit', 'thăm', 'visit', 'mengunjungi'], ['photo', 'bức ảnh', 'photo', 'foto'], ['journey', 'hành trình', 'journey', 'perjalanan']]
});

const TOPIC_LABELS = Object.fromEntries(GRADE5_TOPICS.map((topic) => [topic.id, topic.labels]));

// These extra entries bring each topic to twenty words so a focused mini-game can
// teach a complete unit before review.
const EXTRA_WORDS = Object.freeze({
  family: [['grandchild', 'cháu', 'grandchild', 'cucu'], ['relative', 'người thân', 'relative', 'kerabat'], ['baby', 'em bé', 'baby', 'bayi'], ['son', 'con trai', 'son', 'putra'], ['daughter', 'con gái', 'daughter', 'putri'], ['husband', 'chồng', 'husband', 'suami'], ['wife', 'vợ', 'wife', 'istri'], ['parents', 'bố mẹ', 'parents', 'orang tua']],
  school: [['subject', 'môn học', 'subject', 'mata pelajaran'], ['classmate', 'bạn cùng lớp', 'classmate', 'teman sekelas'], ['exam', 'kỳ thi', 'exam', 'ujian'], ['question', 'câu hỏi', 'question', 'pertanyaan'], ['answer', 'câu trả lời', 'answer', 'jawaban'], ['learn', 'học', 'learn', 'belajar'], ['study', 'học tập', 'study', 'belajar'], ['practice', 'luyện tập', 'practice', 'berlatih']],
  classroom: [['pencilcase', 'hộp bút', 'pencil case', 'kotak pensil'], ['shelf', 'kệ sách', 'shelf', 'rak'], ['paper', 'giấy', 'paper', 'kertas'], ['scissors', 'kéo', 'scissors', 'gunting'], ['glue', 'keo', 'glue', 'lem'], ['marker', 'bút dạ', 'marker', 'spidol'], ['project', 'dự án', 'project', 'proyek'], ['group', 'nhóm', 'group', 'kelompok']],
  home: [['shower', 'vòi sen', 'shower', 'pancuran'], ['towel', 'khăn', 'towel', 'handuk'], ['kitchen', 'nhà bếp', 'kitchen', 'dapur'], ['bedroom', 'phòng ngủ', 'bedroom', 'kamar tidur'], ['garden', 'khu vườn', 'garden', 'taman'], ['door', 'cửa', 'door', 'pintu'], ['window', 'cửa sổ', 'window', 'jendela'], ['floor', 'sàn nhà', 'floor', 'lantai']],
  clothes: [['belt', 'thắt lưng', 'belt', 'ikat pinggang'], ['scarf', 'khăn quàng', 'scarf', 'syal'], ['gloves', 'găng tay', 'gloves', 'sarung tangan'], ['boots', 'ủng', 'boots', 'sepatu bot'], ['jeans', 'quần jean', 'jeans', 'jins'], ['size', 'kích cỡ', 'size', 'ukuran'], ['wear', 'mặc', 'wear', 'memakai'], ['color', 'màu sắc', 'color', 'warna']],
  body: [['shoulder', 'vai', 'shoulder', 'bahu'], ['back', 'lưng', 'back', 'punggung'], ['knee', 'đầu gối', 'knee', 'lutut'], ['finger', 'ngón tay', 'finger', 'jari'], ['toe', 'ngón chân', 'toe', 'jari kaki'], ['neck', 'cổ', 'neck', 'leher'], ['stomach', 'bụng', 'stomach', 'perut'], ['blood', 'máu', 'blood', 'darah']],
  health: [['clinic', 'phòng khám', 'clinic', 'klinik'], ['patient', 'bệnh nhân', 'patient', 'pasien'], ['temperature', 'nhiệt độ', 'temperature', 'suhu'], ['headache', 'đau đầu', 'headache', 'sakit kepala'], ['toothache', 'đau răng', 'toothache', 'sakit gigi'], ['heal', 'chữa lành', 'heal', 'menyembuhkan'], ['bandage', 'băng gạc', 'bandage', 'perban'], ['checkup', 'khám bệnh', 'checkup', 'pemeriksaan']],
  animals: [['lion', 'sư tử', 'lion', 'singa'], ['bear', 'gấu', 'bear', 'beruang'], ['giraffe', 'hươu cao cổ', 'giraffe', 'jerapah'], ['zebra', 'ngựa vằn', 'zebra', 'zebra'], ['snake', 'rắn', 'snake', 'ular'], ['frog', 'ếch', 'frog', 'katak'], ['turtle', 'rùa', 'turtle', 'kura-kura'], ['insect', 'côn trùng', 'insect', 'serangga']],
  pets: [['hamster', 'chuột hamster', 'hamster', 'hamster'], ['parrot', 'vẹt', 'parrot', 'burung beo'], ['aquarium', 'bể cá', 'aquarium', 'akuarium'], ['leash', 'dây dắt', 'leash', 'tali'], ['bowl', 'bát', 'bowl', 'mangkuk'], ['toy', 'đồ chơi', 'toy', 'mainan'], ['brush', 'bàn chải', 'brush', 'sikat'], ['wash', 'tắm rửa', 'wash', 'mencuci']],
  food: [['chicken', 'thịt gà', 'chicken', 'ayam'], ['fish', 'cá', 'fish', 'ikan'], ['potato', 'khoai tây', 'potato', 'kentang'], ['tomato', 'cà chua', 'tomato', 'tomat'], ['onion', 'hành tây', 'onion', 'bawang'], ['cheese', 'phô mai', 'cheese', 'keju'], ['salt', 'muối', 'salt', 'garam'], ['hungry', 'đói', 'hungry', 'lapar']],
  drinks: [['soda', 'nước ngọt', 'soda', 'minuman bersoda'], ['chocolate', 'sô cô la', 'chocolate', 'cokelat'], ['straw', 'ống hút', 'straw', 'sedotan'], ['flavor', 'hương vị', 'flavor', 'rasa'], ['sweet', 'ngọt', 'sweet', 'manis'], ['ice', 'đá', 'ice', 'es'], ['hot', 'nóng', 'hot', 'panas'], ['refill', 'rót thêm', 'refill', 'isi ulang']],
  colors: [['light', 'sáng', 'light', 'terang'], ['dark', 'tối', 'dark', 'gelap'], ['gold', 'vàng kim', 'gold', 'emas'], ['silver', 'bạc', 'silver', 'perak'], ['bright', 'rực rỡ', 'bright', 'cerah'], ['rainbow', 'cầu vồng', 'rainbow', 'pelangi'], ['shade', 'sắc độ', 'shade', 'corak'], ['paint', 'sơn', 'paint', 'cat']],
  numbers: [['eleven', 'mười một', 'eleven', 'sebelas'], ['twelve', 'mười hai', 'twelve', 'dua belas'], ['twenty', 'hai mươi', 'twenty', 'dua puluh'], ['hundred', 'một trăm', 'hundred', 'seratus'], ['first', 'thứ nhất', 'first', 'pertama'], ['second', 'thứ hai', 'second', 'kedua'], ['third', 'thứ ba', 'third', 'ketiga'], ['count', 'đếm', 'count', 'menghitung']],
  time: [['noon', 'buổi trưa', 'noon', 'siang'], ['midnight', 'nửa đêm', 'midnight', 'tengah malam'], ['weekend', 'cuối tuần', 'weekend', 'akhir pekan'], ['holiday', 'kỳ nghỉ', 'holiday', 'liburan'], ['schedule', 'lịch trình', 'schedule', 'jadwal'], ['always', 'luôn luôn', 'always', 'selalu'], ['never', 'không bao giờ', 'never', 'tidak pernah'], ['early', 'sớm', 'early', 'lebih awal']],
  calendar: [['january', 'tháng một', 'January', 'Januari'], ['february', 'tháng hai', 'February', 'Februari'], ['spring', 'mùa xuân', 'spring', 'musim semi'], ['summer', 'mùa hè', 'summer', 'musim panas'], ['autumn', 'mùa thu', 'autumn', 'musim gugur'], ['winter', 'mùa đông', 'winter', 'musim dingin'], ['birthday', 'sinh nhật', 'birthday', 'ulang tahun'], ['season', 'mùa', 'season', 'musim']],
  weather: [['forecast', 'dự báo', 'forecast', 'ramalan'], ['temperature', 'nhiệt độ', 'temperature', 'suhu'], ['season', 'mùa', 'season', 'musim'], ['thunder', 'sấm', 'thunder', 'guntur'], ['lightning', 'chớp', 'lightning', 'petir'], ['rainbow', 'cầu vồng', 'rainbow', 'pelangi'], ['fog', 'sương mù', 'fog', 'kabut'], ['drizzle', 'mưa phùn', 'drizzle', 'gerimis']],
  nature: [['leaf', 'lá', 'leaf', 'daun'], ['grass', 'cỏ', 'grass', 'rumput'], ['rock', 'đá', 'rock', 'batu'], ['island', 'hòn đảo', 'island', 'pulau'], ['ocean', 'đại dương', 'ocean', 'samudra'], ['desert', 'sa mạc', 'desert', 'gurun'], ['ground', 'mặt đất', 'ground', 'tanah'], ['branch', 'cành cây', 'branch', 'dahan']],
  places: [['hospital', 'bệnh viện', 'hospital', 'rumah sakit'], ['postoffice', 'bưu điện', 'post office', 'kantor pos'], ['restaurant', 'nhà hàng', 'restaurant', 'restoran'], ['cinema', 'rạp chiếu phim', 'cinema', 'bioskop'], ['playground', 'sân chơi', 'playground', 'taman bermain'], ['church', 'nhà thờ', 'church', 'gereja'], ['bakery', 'tiệm bánh', 'bakery', 'toko roti'], ['library', 'thư viện', 'library', 'perpustakaan']],
  transport: [['motorcycle', 'xe máy', 'motorcycle', 'sepeda motor'], ['truck', 'xe tải', 'truck', 'truk'], ['subway', 'tàu điện ngầm', 'subway', 'kereta bawah tanah'], ['ferry', 'phà', 'ferry', 'feri'], ['driver', 'tài xế', 'driver', 'pengemudi'], ['passenger', 'hành khách', 'passenger', 'penumpang'], ['traffic', 'giao thông', 'traffic', 'lalu lintas'], ['helmet', 'mũ bảo hiểm', 'helmet', 'helm']],
  community: [['library', 'thư viện', 'library', 'perpustakaan'], ['restaurant', 'nhà hàng', 'restaurant', 'restoran'], ['mayor', 'thị trưởng', 'mayor', 'wali kota'], ['citizen', 'công dân', 'citizen', 'warga'], ['service', 'dịch vụ', 'service', 'layanan'], ['neighborhood', 'khu phố', 'neighborhood', 'lingkungan'], ['volunteer', 'tình nguyện viên', 'volunteer', 'sukarelawan'], ['meeting', 'cuộc họp', 'meeting', 'rapat']],
  jobs: [['engineer', 'kỹ sư', 'engineer', 'insinyur'], ['firefighter', 'lính cứu hỏa', 'firefighter', 'pemadam kebakaran'], ['dentist', 'nha sĩ', 'dentist', 'dokter gigi'], ['musician', 'nhạc sĩ', 'musician', 'musisi'], ['writer', 'nhà văn', 'writer', 'penulis'], ['scientist', 'nhà khoa học', 'scientist', 'ilmuwan'], ['manager', 'quản lý', 'manager', 'manajer'], ['photographer', 'nhiếp ảnh gia', 'photographer', 'fotografer']],
  hobbies: [['cooking', 'nấu ăn', 'cooking', 'memasak'], ['gardening', 'làm vườn', 'gardening', 'berkebun'], ['painting', 'hội họa', 'painting', 'melukis'], ['fishing', 'câu cá', 'fishing', 'memancing'], ['reading', 'đọc sách', 'reading', 'membaca'], ['photography', 'nhiếp ảnh', 'photography', 'fotografi'], ['traveling', 'đi du lịch', 'traveling', 'bepergian'], ['collecting', 'sưu tầm', 'collecting', 'mengoleksi']],
  sports: [['baseball', 'bóng chày', 'baseball', 'bisbol'], ['golf', 'gôn', 'golf', 'golf'], ['hockey', 'khúc côn cầu', 'hockey', 'hoki'], ['race', 'cuộc đua', 'race', 'perlombaan'], ['player', 'người chơi', 'player', 'pemain'], ['win', 'chiến thắng', 'win', 'menang'], ['lose', 'thua', 'lose', 'kalah'], ['match', 'trận đấu', 'match', 'pertandingan']],
  actions: [['run', 'chạy', 'run', 'berlari'], ['jump', 'nhảy', 'jump', 'melompat'], ['sit', 'ngồi', 'sit', 'duduk'], ['stand', 'đứng', 'stand', 'berdiri'], ['work', 'làm việc', 'work', 'bekerja'], ['play', 'chơi', 'play', 'bermain'], ['wash', 'rửa', 'wash', 'mencuci'], ['sleep', 'ngủ', 'sleep', 'tidur']],
  feelings: [['love', 'yêu', 'love', 'mencintai'], ['hate', 'ghét', 'hate', 'membenci'], ['calm', 'bình tĩnh', 'calm', 'tenang'], ['nervous', 'lo lắng', 'nervous', 'gugup'], ['surprised', 'ngạc nhiên', 'surprised', 'terkejut'], ['confused', 'bối rối', 'confused', 'bingung'], ['lonely', 'cô đơn', 'lonely', 'kesepian'], ['thankful', 'biết ơn', 'thankful', 'bersyukur']],
  adjectives: [['beautiful', 'đẹp', 'beautiful', 'indah'], ['ugly', 'xấu', 'ugly', 'jelek'], ['hot', 'nóng', 'hot', 'panas'], ['cold', 'lạnh', 'cold', 'dingin'], ['easy', 'dễ', 'easy', 'mudah'], ['difficult', 'khó', 'difficult', 'sulit'], ['quiet', 'yên tĩnh', 'quiet', 'tenang'], ['loud', 'ồn ào', 'loud', 'keras']],
  house: [['bedroom', 'phòng ngủ', 'bedroom', 'kamar tidur'], ['kitchen', 'nhà bếp', 'kitchen', 'dapur'], ['bathroom', 'phòng tắm', 'bathroom', 'kamar mandi'], ['garden', 'khu vườn', 'garden', 'taman'], ['garage', 'nhà để xe', 'garage', 'garasi'], ['mirror', 'gương', 'mirror', 'cermin'], ['refrigerator', 'tủ lạnh', 'refrigerator', 'kulkas'], ['television', 'tivi', 'television', 'televisi']],
  technology: [['app', 'ứng dụng', 'app', 'aplikasi'], ['password', 'mật khẩu', 'password', 'kata sandi'], ['login', 'đăng nhập', 'login', 'masuk'], ['download', 'tải xuống', 'download', 'mengunduh'], ['upload', 'tải lên', 'upload', 'mengunggah'], ['printer', 'máy in', 'printer', 'printer'], ['speaker', 'loa', 'speaker', 'pengeras suara'], ['charger', 'bộ sạc', 'charger', 'pengisi daya']],
  safety: [['seatbelt', 'dây an toàn', 'seatbelt', 'sabuk pengaman'], ['firstaid', 'sơ cứu', 'first aid', 'pertolongan pertama'], ['obey', 'tuân thủ', 'obey', 'mematuhi'], ['attention', 'chú ý', 'attention', 'perhatian'], ['smoke', 'khói', 'smoke', 'asap'], ['rescue', 'cứu hộ', 'rescue', 'penyelamatan'], ['alarm', 'chuông báo động', 'alarm', 'alarm'], ['exit', 'lối thoát', 'exit', 'jalan keluar']],
  environment: [['climate', 'khí hậu', 'climate', 'iklim'], ['pollution', 'ô nhiễm', 'pollution', 'polusi'], ['plastic', 'nhựa', 'plastic', 'plastik'], ['reuse', 'tái sử dụng', 'reuse', 'menggunakan kembali'], ['reduce', 'giảm bớt', 'reduce', 'mengurangi'], ['save', 'tiết kiệm', 'save', 'menghemat'], ['river', 'sông', 'river', 'sungai'], ['protect', 'bảo vệ', 'protect', 'melindungi']],
  festivals: [['newyear', 'năm mới', 'new year', 'tahun baru'], ['christmas', 'giáng sinh', 'Christmas', 'Natal'], ['tet', 'tết', 'Tet', 'Tet'], ['fireworks', 'pháo hoa', 'fireworks', 'kembang api'], ['costume', 'trang phục', 'costume', 'kostum'], ['invitation', 'lời mời', 'invitation', 'undangan'], ['guest', 'khách mời', 'guest', 'tamu'], ['celebration', 'lễ kỷ niệm', 'celebration', 'perayaan']],
  travel: [['luggage', 'hành lý', 'luggage', 'bagasi'], ['guide', 'hướng dẫn viên', 'guide', 'pemandu'], ['tourist', 'khách du lịch', 'tourist', 'wisatawan'], ['suitcase', 'va li', 'suitcase', 'koper'], ['border', 'biên giới', 'border', 'perbatasan'], ['souvenir', 'quà lưu niệm', 'souvenir', 'suvenir'], ['island', 'hòn đảo', 'island', 'pulau'], ['reservation', 'đặt chỗ', 'reservation', 'reservasi']]
});

const ALL_WORDS = Object.fromEntries(Object.keys(WORDS).map((topicId) => [topicId, [...WORDS[topicId], ...(EXTRA_WORDS[topicId] || [])]]));

export const GRADE5_VOCABULARY = Object.freeze(Object.entries(ALL_WORDS).flatMap(([topicId, entries]) => entries.map(([slug, vi, en, id], index) => ({
  id: `grade5-${topicId}-${slug}`,
  conceptId: `grade5-${topicId}-${slug}`,
  topic: topicId,
  topicLabel: TOPIC_LABELS[topicId],
  level: index < 8 ? 'easy' : 'medium',
  texts: Object.freeze({ vi, en, id }),
  verified: true
}))));

// Expose content QA separately from gameplay. The generator removes normalized
// duplicates from each progression sequence instead of silently repeating them.
export const GRADE5_VOCABULARY_AUDIT = auditVocabularyBank(GRADE5_VOCABULARY);

const lesson = (id, title, titleEn, titleId, topicIds, options = {}) => Object.freeze({
  id,
  title,
  titles: Object.freeze({ vi: title, en: titleEn, id: titleId }),
  topicIds: Object.freeze(topicIds),
  topic: topicIds.length === 1 ? topicIds[0] : 'all',
  stage: options.stage || 'words',
  level: options.level || 'all',
  targetCount: options.targetCount || 24,
  maxTargets: options.maxTargets || 2,
  targetType: 'concepts',
  minAccuracy: options.minAccuracy || 80,
  stars: Object.freeze(options.stars || [0, 85, 95]),
  noDamage: true,
  progressionMode: options.progressionMode || 'fifteen-screen',
  freeScreenCount: Math.max(1, Number(options.freeScreenCount || 5)),
  paid: Boolean(options.paid),
  description: options.description || ''
});

export const GRADE5_FREE_LESSONS = Object.freeze([
  lesson('grade5-01-family-school', 'Gia đình và trường học', 'Family and school', 'Keluarga dan sekolah', ['family', 'school']),
  lesson('grade5-02-classroom-home', 'Lớp học và sinh hoạt', 'Classroom and home life', 'Ruang kelas dan rumah', ['classroom', 'home']),
  lesson('grade5-03-clothes-body', 'Quần áo và cơ thể', 'Clothes and body', 'Pakaian dan tubuh', ['clothes', 'body']),
  lesson('grade5-04-health-animals', 'Sức khỏe và động vật', 'Health and animals', 'Kesehatan dan hewan', ['health', 'animals']),
  lesson('grade5-05-pets-food', 'Thú cưng và đồ ăn', 'Pets and food', 'Hewan peliharaan dan makanan', ['pets', 'food']),
  lesson('grade5-06-drinks-colors', 'Đồ uống và màu sắc', 'Drinks and colors', 'Minuman dan warna', ['drinks', 'colors']),
  lesson('grade5-07-numbers-time', 'Số đếm và thời gian', 'Numbers and time', 'Angka dan waktu', ['numbers', 'time']),
  lesson('grade5-08-calendar-weather', 'Lịch và thời tiết', 'Calendar and weather', 'Kalender dan cuaca', ['calendar', 'weather']),
  lesson('grade5-09-nature-places', 'Thiên nhiên và địa điểm', 'Nature and places', 'Alam dan tempat', ['nature', 'places']),
  lesson('grade5-10-transport-community', 'Giao thông và cộng đồng', 'Transport and community', 'Transportasi dan komunitas', ['transport', 'community']),
  lesson('grade5-11-jobs-hobbies', 'Nghề nghiệp và sở thích', 'Jobs and hobbies', 'Pekerjaan dan hobi', ['jobs', 'hobbies']),
  lesson('grade5-12-sports-actions', 'Thể thao và hành động', 'Sports and actions', 'Olahraga dan tindakan', ['sports', 'actions']),
  lesson('grade5-13-feelings-adjectives', 'Cảm xúc và tính từ', 'Feelings and adjectives', 'Perasaan dan kata sifat', ['feelings', 'adjectives']),
  lesson('grade5-14-house-technology', 'Nhà cửa và công nghệ', 'House and technology', 'Rumah dan teknologi', ['house', 'technology']),
  lesson('grade5-15-safety-environment', 'An toàn và môi trường', 'Safety and environment', 'Keselamatan dan lingkungan', ['safety', 'environment']),
  lesson('grade5-16-festivals-travel', 'Lễ hội và du lịch', 'Festivals and travel', 'Perayaan dan perjalanan', ['festivals', 'travel']),
  lesson('grade5-17-review-home', 'Ôn tập đời sống', 'Daily-life review', 'Ulasan kehidupan sehari-hari', ['family', 'school', 'classroom', 'home', 'clothes', 'body', 'health', 'animals'], { targetCount: 28, level: 'all' }),
  lesson('grade5-18-review-world', 'Ôn tập thế giới quanh em', 'World-around-us review', 'Ulasan dunia sekitar', ['pets', 'food', 'drinks', 'colors', 'numbers', 'time', 'calendar', 'weather'], { targetCount: 28, level: 'all' }),
  lesson('grade5-19-review-community', 'Ôn tập cộng đồng', 'Community review', 'Ulasan komunitas', ['nature', 'places', 'transport', 'community', 'jobs', 'hobbies', 'sports', 'actions'], { targetCount: 28, level: 'all' }),
  lesson('grade5-20-final', 'Thử thách tổng hợp', 'Mixed challenge', 'Tantangan gabungan', ['feelings', 'adjectives', 'house', 'technology', 'safety', 'environment', 'festivals', 'travel'], { targetCount: 75, level: 'all', minAccuracy: 85, maxTargets: 3 }),
  lesson('grade5-21-science-space', 'Khoa học và không gian', 'Science and space', 'Sains dan ruang angkasa', ['technology', 'nature', 'places']),
]);

export const GRADE5_PAID_PACKS = Object.freeze([
  lesson('grade5-paid-01-sentence', 'Cụm từ và câu ngắn', 'Phrases and short sentences', 'Frasa dan kalimat pendek', ['family', 'school', 'actions'], { paid: true, targetCount: 36, minAccuracy: 88 }),
  lesson('grade5-paid-02-descriptions', 'Mô tả người và vật', 'People and object descriptions', 'Deskripsi orang dan benda', ['body', 'clothes', 'adjectives'], { paid: true, targetCount: 36, minAccuracy: 88 }),
  lesson('grade5-paid-03-health-dialogue', 'Hội thoại sức khỏe', 'Health dialogues', 'Dialog kesehatan', ['health', 'feelings'], { paid: true, targetCount: 36, minAccuracy: 88 }),
  lesson('grade5-paid-04-food-dialogue', 'Gọi món và đồ uống', 'Food and drink dialogues', 'Dialog makanan dan minuman', ['food', 'drinks'], { paid: true, targetCount: 36, minAccuracy: 88 }),
  lesson('grade5-paid-05-time-plans', 'Lịch và kế hoạch', 'Time and plans', 'Waktu dan rencana', ['numbers', 'time', 'calendar'], { paid: true, targetCount: 36, minAccuracy: 88 }),
  lesson('grade5-paid-06-weather-trip', 'Thời tiết và chuyến đi', 'Weather and trips', 'Cuaca dan perjalanan', ['weather', 'transport', 'travel'], { paid: true, targetCount: 36, minAccuracy: 88 }),
  lesson('grade5-paid-07-community-jobs', 'Cộng đồng và nghề nghiệp', 'Community and jobs', 'Komunitas dan pekerjaan', ['community', 'jobs'], { paid: true, targetCount: 36, minAccuracy: 88 }),
  lesson('grade5-paid-08-hobbies-sports', 'Sở thích và thể thao', 'Hobbies and sports', 'Hobi dan olahraga', ['hobbies', 'sports'], { paid: true, targetCount: 36, minAccuracy: 88 }),
  lesson('grade5-paid-09-home-tech', 'Nhà thông minh', 'Home and technology', 'Rumah dan teknologi', ['home', 'house', 'technology'], { paid: true, targetCount: 36, minAccuracy: 88 }),
  lesson('grade5-paid-10-safety-nature', 'Bảo vệ môi trường', 'Safety and nature protection', 'Keselamatan dan perlindungan alam', ['safety', 'environment', 'nature'], { paid: true, targetCount: 36, minAccuracy: 88 }),
  lesson('grade5-paid-11-festival-story', 'Kể chuyện lễ hội', 'Festival stories', 'Cerita perayaan', ['festivals', 'family', 'feelings'], { paid: true, targetCount: 40, minAccuracy: 90 }),
  lesson('grade5-paid-12-master', 'Bậc thầy đa chủ đề', 'Multitopic mastery', 'Penguasaan semua topik', GRADE5_TOPICS.map((topic) => topic.id), { paid: true, targetCount: 48, minAccuracy: 90, maxTargets: 3 })
]);

export const GRADE5_LESSON_TEMPLATES = Object.freeze([...GRADE5_FREE_LESSONS, ...GRADE5_PAID_PACKS]);

// The 15-screen course uses a small course-only supplement. It is deliberately
// kept outside the 640-word concept bank so the public vocabulary count remains
// stable while screen 1 can still contain valid one-grapheme targets.
const progressionWord = (id, vi, en, idText) => Object.freeze({
  id,
  texts: Object.freeze({ vi, en, id: idText })
});

export const GRADE5_PROGRESSION_ONE_CHAR_WORDS = Object.freeze([
  progressionWord('progression-char-a', 'a', 'a', 'a'),
  progressionWord('progression-char-o-circumflex', '\u00f4', 'i', 'i'),
  progressionWord('progression-char-o-hook', '\u01a1', 'o', 'u'),
  progressionWord('progression-char-e-circumflex', '\u00ea', 'u', 'e'),
  progressionWord('progression-char-a-grave', '\u00e0', 'a', 'a'),
  progressionWord('progression-char-u-acute', '\u1ee9', 'o', 'o')
]);

export const GRADE5_PROGRESSION_EXTRA_WORDS = Object.freeze([
  progressionWord('progression-vi-thang', 'th\u00e1ng', 'month', 'bulan'),
  progressionWord('progression-vi-chieu', 'chi\u1ec1u', 'afternoon', 'sore'),
  progressionWord('progression-vi-phong', 'ph\u00f2ng', 'room', 'kamar'),
  progressionWord('progression-vi-trong', 'tr\u1ed1ng', 'drum', 'genderang'),
  progressionWord('progression-vi-khach', 'kh\u00e1ch', 'guest', 'tamu'),
  progressionWord('progression-vi-chung', 'ch\u00fang', 'we', 'kami'),
  progressionWord('progression-vi-trang', 'tr\u1eafng', 'white', 'putih'),
  progressionWord('progression-vi-thang-adj', 'th\u1eb3ng', 'straight', 'lurus'),
  progressionWord('progression-vi-truong', 'tr\u01b0\u1eddng', 'school', 'sekolah'),
  progressionWord('progression-vi-thuyen', 'thuy\u1ec1n', 'boat', 'perahu'),
  progressionWord('progression-vi-chuyen', 'chuy\u1ec7n', 'story', 'cerita'),
  progressionWord('progression-vi-duong', '\u0111\u01b0\u1eddng', 'roadway', 'jalan raya'),
  progressionWord('progression-vi-phuong', 'ph\u01b0\u1ee3ng', 'phoenix', 'burung phoenix'),
  progressionWord('progression-vi-nghiep', 'nghi\u1ec7p', 'career', 'karier'),
  progressionWord('progression-vi-khoang', 'kho\u1ea3ng', 'distance', 'jarak'),
  progressionWord('progression-vi-truong-adj', 'tr\u01b0\u1edfng', 'leader', 'pemimpin'),
  progressionWord('progression-vi-chuong', 'ch\u01b0\u01a1ng', 'chapter', 'bab'),
  progressionWord('progression-vi-thuong', 'th\u01b0\u1edfng', 'reward', 'hadiah'),
  progressionWord('progression-en-am', 's\u00e1ng', 'am', 'pagi'),
  progressionWord('progression-en-an', 'm\u1ed9t', 'an', 'sebuah'),
  progressionWord('progression-en-as', 'nh\u01b0', 'as', 'seperti'),
  progressionWord('progression-en-at', 't\u1ea1i', 'at', 'di'),
  progressionWord('progression-en-be', 'l\u00e0', 'be', 'menjadi'),
  progressionWord('progression-en-by', 'b\u1edfi', 'by', 'oleh'),
  progressionWord('progression-en-do', 'l\u00e0m', 'do', 'melakukan'),
  progressionWord('progression-en-he', 'anh \u1ea5y', 'he', 'dia laki-laki'),
  progressionWord('progression-en-if', 'n\u1ebfu', 'if', 'jika'),
  progressionWord('progression-en-in', 'trong', 'in', 'di dalam'),
  progressionWord('progression-id-ia', 'kia', 'there', 'ia'),
  progressionWord('progression-id-ya', 'v\u00e2ng', 'yes', 'ya'),
  progressionWord('progression-id-di', '\u0111i', 'go', 'di'),
  progressionWord('progression-id-ke', '\u0111\u1ebfn', 'to', 'ke'),
  progressionWord('progression-id-si', 'ng\u01b0\u1eddi', 'person', 'si'),
  progressionWord('progression-id-ku', 'c\u1ee7a t\u00f4i', 'my', 'ku'),
  progressionWord('progression-id-mu', 'c\u1ee7a b\u1ea1n', 'your', 'mu'),
  progressionWord('progression-id-oh', '\u00f4i', 'oh', 'oh'),
  progressionWord('progression-id-eh', '\u00e0', 'eh', 'eh'),
  progressionWord('progression-id-ah', '\u00e1', 'ah', 'ah')
]);

const sentence = (vi, en, id) => Object.freeze({ texts: Object.freeze({ vi, en, id }) });
const sentencePack = (...items) => Object.freeze(items);

// The first six Vietnamese lessons are authored sequences, not random draws.
// Keeping them here prevents the progression generator from borrowing words
// from unrelated topics just to satisfy a length quota.
const viProgressionScreen = (...items) => Object.freeze(items);

export const GRADE5_VI_PROGRESSION_SCRIPTS = Object.freeze({
  'grade5-01-family-school': Object.freeze([
    viProgressionScreen('a', '\u0103', '\u00e2'),
    viProgressionScreen('ba', 'm\u1eb9', 'b\u00e9'),
    viProgressionScreen('cha', 'con', 'anh'),
    viProgressionScreen('s\u00e1ch', 'b\u1ea3ng', 'th\u1ea7y'),
    viProgressionScreen('ng\u01b0\u1eddi', 'ngoan', 'th\u01b0\u1edbc'),
    viProgressionScreen('tr\u01b0\u1eddng', 'th\u01b0\u01a1ng', 'khuy\u00ean'),
    viProgressionScreen('ba m\u1eb9', 'c\u00f4 d\u00ec', 'm\u1eb9 ru'),
    viProgressionScreen('cha con', 'anh ch\u1ecb', 'b\u00e0n gh\u1ebf'),
    viProgressionScreen('s\u00e1ch to\u00e1n', 'th\u1ea7y gi\u00e1o', 'gi\u00e1o vi\u00ean'),
    viProgressionScreen('ngoan ngo\u00e3n', 'th\u01b0\u1edbc th\u1eb3ng', 'khang trang'),
    viProgressionScreen('tr\u01b0\u1eddng chuy\u00ean', 'chuy\u1ec3n tr\u01b0\u1eddng', 'ch\u01b0\u01a1ng truy\u1ec7n'),
    viProgressionScreen('Ba m\u1eb9 y\u00eau con.'),
    viProgressionScreen('Em l\u00e0 h\u1ecdc sinh ngoan.'),
    viProgressionScreen('Gia \u0111\u00ecnh em lu\u00f4n tr\u00e0n ng\u1eadp ni\u1ec1m vui.'),
    viProgressionScreen('M\u00e1i tr\u01b0\u1eddng th\u00e2n y\u00eau l\u00e0 n\u01a1i em h\u1ecdc t\u1eadp.')
  ]),
  'grade5-02-classroom-home': Object.freeze([
    viProgressionScreen('b', 'c', 'd'),
    viProgressionScreen('v\u1edf', 't\u1ee7', '\u0111i'),
    viProgressionScreen('b\u00e0n', 'gh\u1ebf', 'b\u00fat'),
    viProgressionScreen('s\u00e1ch', 'b\u1ea3ng', 'ph\u1ea5n'),
    viProgressionScreen('th\u01b0\u1edbc', 'ph\u00f2ng', 'gi\u1ea3ng'),
    viProgressionScreen('tr\u01b0\u1eddng', 'chu\u00f4ng', 'khuy\u00ean'),
    viProgressionScreen('t\u00f4 v\u1ebd', 't\u1ee7 \u0111\u1ed3', '\u0111i b\u1ed9'),
    viProgressionScreen('h\u1ecdc b\u00e0i', 'b\u00fat m\u1ef1c', 't\u1eadp \u0111\u1ecdc'),
    viProgressionScreen('vi\u1ebft b\u1ea3ng', 'gi\u00e1o khoa', 'sinh ho\u1ea1t'),
    viProgressionScreen('th\u01b0\u1edbc th\u1eb3ng', 'tuy\u00ean d\u01b0\u01a1ng', 'gi\u1ea3ng ngh\u0129a'),
    viProgressionScreen('chu\u00f4ng tr\u01b0\u1eddng', 'ch\u01b0\u01a1ng tr\u00ecnh', 'nghi\u00eam trang'),
    viProgressionScreen('Em ng\u1ed3i h\u1ecdc b\u00e0i.'),
    viProgressionScreen('H\u1ecdc sinh gi\u1eef l\u1edbp s\u1ea1ch \u0111\u1eb9p.'),
    viProgressionScreen('Ch\u00fang em lu\u00f4n lu\u00f4n k\u00ednh tr\u1ecdng th\u1ea7y c\u00f4.'),
    viProgressionScreen('Ch\u00fang em h\u0103ng h\u00e1i ph\u00e1t bi\u1ec3u x\u00e2y d\u1ef1ng b\u00e0i.')
  ]),
  'grade5-03-clothes-body': Object.freeze([
    viProgressionScreen('o', '\u00f4', '\u01a1'),
    viProgressionScreen('da', 'eo', 'c\u1ed5'),
    viProgressionScreen('tay', 'tai', 't\u00f3c'),
    viProgressionScreen('ch\u00e2n', 'b\u1ee5ng', 'l\u01b0ng'),
    viProgressionScreen('mi\u1ec7ng', 'ng\u01b0\u1eddi', 'kho\u00e1c'),
    viProgressionScreen('cho\u00e0ng', 'th\u01b0\u01a1ng', 'khuy\u00ean'),
    viProgressionScreen('c\u1ed5 \u00e1o', 't\u00e0 \u00e1o', '\u00e1o m\u0169'),
    viProgressionScreen('t\u00f3c tai', 'b\u00e0n tay', 'm\u1eaft m\u00f4i'),
    viProgressionScreen('th\u00e2n h\u00ecnh', 'm\u00f3ng ch\u00e2n', 'qu\u1ea7n ng\u1eafn'),
    viProgressionScreen('khu\u00f4n mi\u1ec7ng', 'kho\u00e1c ngo\u00e0i', 'trang tr\u1ecdng'),
    viProgressionScreen('tr\u01b0\u1edfng th\u00e0nh', 'trang nghi\u00eam', 'truy\u1ec1n nhi\u1ec5m'),
    viProgressionScreen('\u00c1o qu\u1ea7n s\u1ea1ch \u0111\u1eb9p.'),
    viProgressionScreen('Em gi\u1eef v\u1ec7 sinh th\u00e2n th\u1ec3.'),
    viProgressionScreen('B\u00e9 gi\u1eef g\u00ecn \u0111\u00f4i b\u00e0n tay s\u1ea1ch s\u1ebd.'),
    viProgressionScreen('M\u1eb7c trang ph\u1ee5c g\u1ecdn g\u00e0ng gi\u00fap em t\u1ef1 tin.')
  ]),
  'grade5-04-health-animals': Object.freeze([
    viProgressionScreen('u', '\u01b0', 'y'),
    viProgressionScreen('b\u00f2', 'd\u00ea', 'c\u00e1'),
    viProgressionScreen('heo', 'c\u00fan', 'voi'),
    viProgressionScreen('chim', 'ng\u1ef1a', 'b\u1ec7nh'),
    viProgressionScreen('thu\u1ed1c', 'chu\u1ed9t', 'khu\u1ea9n'),
    viProgressionScreen('chu\u1ed3ng', 'th\u01b0\u01a1ng', 'ph\u01b0\u01a1ng'),
    viProgressionScreen('b\u00f2 b\u00ea', 'g\u00e0 ri', 'b\u1ecb ho'),
    viProgressionScreen('c\u00fan con', 'c\u1ea3m c\u00fam', 'tim gan'),
    viProgressionScreen('ng\u1ef1a b\u1ea1ch', 'ch\u1eefa b\u1ec7nh', 'kh\u1ecfe m\u1ea1nh'),
    viProgressionScreen('chu\u1ed9t tr\u1eafng', 'kh\u00e1ng khu\u1ea9n', 'thu\u1ed1c thang'),
    viProgressionScreen('ph\u01b0\u01a1ng thu\u1ed1c', 'd\u01b0\u1ee1ng th\u01b0\u01a1ng', 'chu\u1ed3ng nu\u00f4i'),
    viProgressionScreen('Ch\u00fa ch\u00f3 con ch\u1ea1y tung t\u0103ng.'),
    viProgressionScreen('T\u1eadp th\u1ec3 d\u1ee5c gi\u00fap c\u01a1 th\u1ec3 kh\u1ecfe.'),
    viProgressionScreen('Em y\u00eau qu\u00fd v\u00e0 ch\u0103m s\u00f3c \u0111\u1ed9ng v\u1eadt.'),
    viProgressionScreen('\u0102n u\u1ed1ng \u0111\u1ee7 ch\u1ea5t v\u00e0 r\u00e8n luy\u1ec7n th\u1ec3 thao.')
  ]),
  'grade5-05-pets-food': Object.freeze([
    viProgressionScreen('b', 'c', 'd'),
    viProgressionScreen('c\u00e1', 'g\u00e0', 'm\u00ec'),
    viProgressionScreen('c\u01a1m', 'rau', 'b\u00fan'),
    viProgressionScreen('b\u00e1nh', 'canh', 'th\u1ecbt'),
    viProgressionScreen('chu\u1ed1i', 'tr\u1ee9ng', 'khoai'),
    viProgressionScreen('n\u01b0\u1edbng', 'x\u01b0\u01a1ng', 'chu\u1ed3ng'),
    viProgressionScreen('c\u00e1 m\u00e8', 'g\u00e0 ta', 'c\u00e1 r\u00f4'),
    viProgressionScreen('c\u01a1m rau', 't\u00f4m cua', 'b\u00fan gi\u00f2'),
    viProgressionScreen('b\u00e1nh canh', 'th\u1ecbt lu\u1ed9c', 'ch\u00e1o l\u00f2ng'),
    viProgressionScreen('chu\u1ed1i chi\u00ean', 'tr\u1ee9ng chi\u00ean', 'chu\u1ed9t ki\u1ec3ng'),
    viProgressionScreen('th\u01b0\u1edfng th\u1ee9c', 'x\u01b0\u01a1ng s\u01b0\u1eddn', 'chu\u1ed3ng tr\u1ea1i'),
    viProgressionScreen('M\u00e8o con \u0103n c\u01a1m.'),
    viProgressionScreen('M\u00f3n \u0103n m\u1eb9 n\u1ea5u r\u1ea5t ngon.'),
    viProgressionScreen('Ch\u0103m s\u00f3c th\u00fa c\u01b0ng trong gia \u0111\u00ecnh.'),
    viProgressionScreen('Th\u01b0\u1edfng th\u1ee9c nh\u1eefng m\u00f3n \u0103n b\u1ed5 d\u01b0\u1ee1ng.')
  ]),
  'grade5-06-drinks-colors': Object.freeze([
    viProgressionScreen('\u0111', 'g', 'h'),
    viProgressionScreen('ly', '\u0111\u00e1', '\u0111\u1ecf'),
    viProgressionScreen('tr\u00e0', 'cam', 's\u1eefa'),
    viProgressionScreen('n\u01b0\u1edbc', 'xanh', 'v\u00e0ng'),
    viProgressionScreen('chanh', 'th\u1ea1ch', 'tr\u1eafng'),
    viProgressionScreen('kho\u00e1ng', 'nghi\u1ec1n', 'th\u01b0\u1edfng'),
    viProgressionScreen('ly \u0111\u00e1', '\u0111\u00e1 me', 'ly \u0111\u1ecf'),
    viProgressionScreen('tr\u00e0 \u0111\u00e0o', 's\u1eefa b\u00e9o', 'cam d\u1eeba'),
    viProgressionScreen('n\u01b0\u1edbc ng\u1ecdt', 'xanh bi\u1ebfc', 'h\u1ed3ng t\u01b0\u01a1i'),
    viProgressionScreen('khu\u1ea5y \u0111\u01b0\u1eddng', 'th\u1ea1ch chanh', 'tr\u1eafng trong'),
    viProgressionScreen('n\u01b0\u1edbc kho\u00e1ng', 'th\u01b0\u1edfng tr\u00e0', 'chuy\u1ec3n m\u00e0u'),
    viProgressionScreen('U\u1ed1ng n\u01b0\u1edbc cam t\u01b0\u01a1i.'),
    viProgressionScreen('Ly n\u01b0\u1edbc cam c\u00f3 m\u00e0u v\u00e0ng t\u01b0\u01a1i.'),
    viProgressionScreen('B\u1ee9c tranh m\u00e0u s\u1eafc r\u1ef1c r\u1ee1 sinh \u0111\u1ed9ng.'),
    viProgressionScreen('U\u1ed1ng \u0111\u1ee7 n\u01b0\u1edbc m\u1ed7i ng\u00e0y gi\u00fap kh\u1ecfe m\u1ea1nh.')
  ]),
  'grade5-07-numbers-time': Object.freeze([
    viProgressionScreen('k', 'l', 'm'),
    viProgressionScreen('s\u1ed1', 'ba', 't\u01b0'),
    viProgressionScreen('gi\u1edd', 'n\u0103m', '\u0111\u00eam'),
    viProgressionScreen('ng\u00e0y', 'tu\u1ea7n', 'ph\u00fat'),
    viProgressionScreen('th\u00e1ng', 'khuya', 'chi\u1ec1u'),
    viProgressionScreen('chu\u00f4ng', 'kho\u1ea3ng', 'th\u01b0\u1eddng'),
    viProgressionScreen('s\u1ed1 ba', 's\u1ed1 \u0111o', 'ba t\u01b0'),
    viProgressionScreen('n\u0103m gi\u1edd', 'ban \u0111\u00eam', 'b\u1ea3y gi\u1edd'),
    viProgressionScreen('ph\u00fat gi\u00e2y', 's\u00e1ng tr\u01b0a', 't\u1eebng ng\u00e0y'),
    viProgressionScreen('th\u00e1ng tr\u01b0\u1edbc', 'th\u00e1ng gi\u00eang', 'nhanh ch\u00f3ng'),
    viProgressionScreen('chu\u00f4ng reo', 'th\u01b0\u1eddng ng\u00e0y', 'kho\u1ea3ng ch\u1eebng'),
    viProgressionScreen('Em ch\u0103m ch\u1ec9 t\u1eadp xem gi\u1edd.'),
    viProgressionScreen('M\u1ed9t ng\u00e0y c\u00f3 hai m\u01b0\u01a1i t\u01b0 gi\u1edd.'),
    viProgressionScreen('Th\u1eddi gian tr\u00f4i qua nhanh ch\u00f3ng.'),
    viProgressionScreen('H\u1ecdc c\u00e1ch qu\u1ea3n l\u00fd th\u1eddi gian hi\u1ec7u qu\u1ea3.')
  ]),
  'grade5-08-calendar-weather': Object.freeze([
    viProgressionScreen('n', 'p', 'q'),
    viProgressionScreen('h\u00e8', '\u1ea5m', 'm\u00f9'),
    viProgressionScreen('m\u01b0a', 'gi\u00f3', 'm\u00e2y'),
    viProgressionScreen('n\u1eafng', 'l\u1ea1nh', 'tu\u1ea7n'),
    viProgressionScreen('th\u00e1ng', 'tuy\u1ebft', 's\u01b0\u01a1ng'),
    viProgressionScreen('chuy\u1ec3n', 'tho\u00e1ng', 'th\u01b0\u1eddng'),
    viProgressionScreen('h\u00e8 v\u1ec1', '\u1ea5m \u00e1p', 'l\u00e1 \u0111\u1ecf'),
    viProgressionScreen('m\u01b0a r\u00e0o', 'gi\u00f3 b\u00e3o', 'm\u00e2y \u0111en'),
    viProgressionScreen('n\u1eafng n\u00f3ng', 'l\u1ea1nh c\u00f3ng', 'th\u1eddi ti\u1ebft'),
    viProgressionScreen('tuy\u1ebft tr\u1eafng', 's\u01b0\u01a1ng chi\u1ec1u', 'th\u00e1ng gi\u00eang'),
    viProgressionScreen('chuy\u1ec3n m\u00f9a', 'tho\u00e1ng m\u00e1t', 'th\u01b0\u1eddng ng\u00e0y'),
    viProgressionScreen('H\u00f4m nay tr\u1eddi n\u1eafng.'),
    viProgressionScreen('Th\u1eddi ti\u1ebft m\u00f9a thu r\u1ea5t m\u00e1t m\u1ebb.'),
    viProgressionScreen('Xem l\u1ecbch \u0111\u1ec3 bi\u1ebft c\u00e1c ng\u00e0y ngh\u1ec9.'),
    viProgressionScreen('M\u00f9a xu\u00e2n v\u1ec1 mang \u0111\u1ebfn l\u00e0n gi\u00f3 m\u00e1t r\u01b0\u1ee3i.')
  ]),
  'grade5-09-nature-places': Object.freeze([
    viProgressionScreen('r', 's', 't', 'v'),
    viProgressionScreen('h\u1ed3', '\u0111\u00ea', 'g\u00f2'),
    viProgressionScreen('n\u00fai', '\u0111\u1ed3i', 'b\u00e3i'),
    viProgressionScreen('r\u1eebng', 'bi\u1ec3n', 's\u00f4ng'),
    viProgressionScreen('ngu\u1ed3n', 'thung', 'gh\u1ec1nh'),
    viProgressionScreen('\u0111\u01b0\u1eddng', 'kho\u1ea3ng', 'ph\u01b0\u01a1ng'),
    viProgressionScreen('b\u1edd h\u1ed3', 'b\u1edd \u0111\u00ea', 'g\u00f2 \u0111\u00e1'),
    viProgressionScreen('n\u00fai \u0111\u1ed3i', 'b\u00e3i c\u00e1t', '\u0111\u1ea3o nh\u1ecf'),
    viProgressionScreen('r\u1eebng xanh', 'hang \u0111\u1ed9ng', 's\u00f4ng r\u1ed9ng'),
    viProgressionScreen('ngu\u1ed3n n\u01b0\u1edbc', 'thung l\u0169ng', 'khung c\u1ea3nh'),
    viProgressionScreen('\u0111\u01b0\u1eddng r\u1eebng', 'kho\u1ea3ng tr\u1eddi', 'ph\u01b0\u01a1ng tr\u1eddi'),
    viProgressionScreen('N\u00fai non r\u1ea5t h\u00f9ng v\u0129.'),
    viProgressionScreen('C\u1ea3nh \u0111\u1eb9p thi\u00ean nhi\u00ean k\u1ef3 v\u0129.'),
    viProgressionScreen('Em c\u00f9ng gia \u0111\u00ecnh \u0111i d\u1ea1o ch\u01a1i.'),
    viProgressionScreen('Ch\u00fang em gi\u1eef g\u00ecn v\u1ebb \u0111\u1eb9p c\u1ee7a qu\u00ea h\u01b0\u01a1ng.')
  ]),
  'grade5-10-transport-community': Object.freeze([
    viProgressionScreen('\u00e1', '\u00e0', '\u1ea3'),
    viProgressionScreen('xe', 'ga', '\u0111\u00f2'),
    viProgressionScreen('t\u00e0u', 'ph\u1ed1', 'b\u1ebfn'),
    viProgressionScreen('tr\u1ea1m', 'c\u1ea3ng', 'c\u00f4ng'),
    viProgressionScreen('\u0111\u01b0\u1eddng', 'kh\u00e1ch', 'tuy\u1ebfn'),
    viProgressionScreen('thuy\u1ec1n', 'chuy\u1ebfn', 'ph\u01b0\u01a1ng'),
    viProgressionScreen('\u0111i xe', 'xe ga', '\u0111\u1ed7 xe'),
    viProgressionScreen('t\u00e0u h\u1ecfa', 't\u00e0u bay', 'khu ph\u1ed1'),
    viProgressionScreen('tr\u1ea1m d\u1eebng', 'c\u1ea3ng bi\u1ec3n', 'c\u00f4ng vi\u00ean'),
    viProgressionScreen('tuy\u1ebfn \u0111\u01b0\u1eddng', '\u0111\u01b0\u1eddng ch\u00ednh', 'ng\u01b0\u1ee3c chi\u1ec1u'),
    viProgressionScreen('thuy\u1ec1n tr\u01b0\u1edfng', 'nh\u01b0\u1eddng \u0111\u01b0\u1eddng', 'ph\u01b0\u01a1ng ti\u1ec7n'),
    viProgressionScreen('Xe ch\u1ea1y tr\u00ean \u0111\u01b0\u1eddng.'),
    viProgressionScreen('M\u1ecdi ng\u01b0\u1eddi ch\u1ea5p h\u00e0nh lu\u1eadt giao th\u00f4ng.'),
    viProgressionScreen('Em \u0111i b\u1ed9 sang \u0111\u01b0\u1eddng \u0111\u00fang v\u1ea1ch k\u1ebb.'),
    viProgressionScreen('\u0110i \u0111\u01b0\u1eddng an to\u00e0n l\u00e0 b\u1ea3o v\u1ec7 ch\u00ednh m\u00ecnh.')
  ]),
  'grade5-11-jobs-hobbies': Object.freeze([
    viProgressionScreen('\u00e3', '\u1ea1', '\u1eaf'),
    viProgressionScreen('ca', 'v\u1ebd', 't\u00f4'),
    viProgressionScreen('th\u1ee3', 'may', 'm\u00faa'),
    viProgressionScreen('nh\u1ea1c', 'k\u1ecbch', 'th\u00eau'),
    viProgressionScreen('tranh', 'tr\u1ed3ng', 'thanh'),
    viProgressionScreen('tr\u01b0\u1edfng', 'thuy\u1ec1n', 'ch\u01b0\u01a1ng'),
    viProgressionScreen('ca s\u0129', 'k\u1ef9 s\u01b0', 'c\u1ed5 v\u0169'),
    viProgressionScreen('th\u1ee3 may', 'nh\u00e0 b\u00e1o', 't\u1eadp m\u00faa'),
    viProgressionScreen('gi\u00e1o vi\u00ean', 'c\u00f4ng nh\u00e2n', 'di\u1ec5n k\u1ecbch'),
    viProgressionScreen('luy\u1ec7n thanh', 'tr\u1ed3ng khoai', 'khoan gi\u1ebfng'),
    viProgressionScreen('thuy\u1ec1n tr\u01b0\u1edfng', 'hi\u1ec7u tr\u01b0\u1edfng', 'tr\u01b0\u1edfng ph\u00f2ng'),
    viProgressionScreen('B\u00e9 th\u00edch v\u1ebd tranh.'),
    viProgressionScreen('M\u1ed7i ngh\u1ec1 nghi\u1ec7p \u0111\u1ec1u r\u1ea5t qu\u00fd gi\u00e1.'),
    viProgressionScreen('Em ch\u0103m ch\u1ec9 h\u1ecdc t\u1eadp \u0111\u1ec3 l\u00e0m b\u00e1c s\u0129.'),
    viProgressionScreen('Nu\u00f4i d\u01b0\u1ee1ng \u01b0\u1edbc m\u01a1 v\u00e0 s\u1edf th\u00edch l\u00e0nh m\u1ea1nh.')
  ]),
  'grade5-12-sports-actions': Object.freeze([
    viProgressionScreen('\u1eb3', '\u1eb5', '\u1eb7'),
    viProgressionScreen('\u0111\u00e1', '\u0111i', 't\u1ea1'),
    viProgressionScreen('b\u01a1i', 'leo', 'm\u00faa'),
    viProgressionScreen('b\u00f3ng', 'ch\u1ea1y', 'nh\u1ea3y'),
    viProgressionScreen('tr\u01b0\u1ee3t', 'tuy\u1ebft', 'th\u1eafng'),
    viProgressionScreen('chuy\u1ec1n', 'thuy\u1ec1n', 'th\u01b0\u1edfng'),
    viProgressionScreen('\u0111i b\u1ed9', 'c\u1eed t\u1ea1', 'c\u1ed5 v\u0169'),
    viProgressionScreen('b\u01a1i l\u1ed9i', 'leo n\u00fai', 't\u1eadp b\u01a1i'),
    viProgressionScreen('ch\u1ea1y nh\u1ea3y', '\u0111\u00e1nh b\u00f3ng', 'l\u01b0\u1edbt s\u00f3ng'),
    viProgressionScreen('tr\u01b0\u1ee3t tuy\u1ebft', 'chi\u1ebfn th\u1eafng', 'trung phong'),
    viProgressionScreen('chuy\u1ec1n b\u00f3ng', '\u0111ua thuy\u1ec1n', 'nh\u1eadn th\u01b0\u1edfng'),
    viProgressionScreen('Em t\u1eadp \u0111\u00e1 b\u00f3ng.'),
    viProgressionScreen('Ch\u0103m ch\u1ec9 t\u1eadp th\u1ec3 d\u1ee5c m\u1ed7i ng\u00e0y.'),
    viProgressionScreen('Ch\u1ea1y b\u1ed9 bu\u1ed5i s\u00e1ng gi\u00fap b\u00e9 vui v\u1ebb.'),
    viProgressionScreen('Ch\u0103m t\u1eadp th\u1ec3 thao gi\u00fap c\u01a1 th\u1ec3 d\u1ebbo dai.')
  ]),
  'grade5-13-feelings-adjectives': Object.freeze([
    viProgressionScreen('\u00e0', '\u1ea5', '\u1ea7'),
    viProgressionScreen('lo', 's\u1ee3', 'm\u00ea'),
    viProgressionScreen('y\u00eau', 'qu\u00fd', 'vui'),
    viProgressionScreen('bu\u1ed3n', 'm\u1eebng', 'gi\u1eadn'),
    viProgressionScreen('ngoan', 's\u01b0\u1edbng', 'phi\u1ec1n'),
    viProgressionScreen('th\u01b0\u01a1ng', 'nghi\u00eam', 'ng\u01b0\u1ee3ng'),
    viProgressionScreen('lo s\u1ee3', 'lo \u00e2u', 'h\u1ea3 h\u00ea'),
    viProgressionScreen('y\u00eau qu\u00fd', 'b\u1ef1c t\u1ee9c', 'y\u00eau \u0111\u1eddi'),
    viProgressionScreen('bu\u1ed3n ch\u00e1n', 'n\u00f3ng gi\u1eadn', 'b\u00ecnh t\u0129nh'),
    viProgressionScreen('ngoan ngo\u00e3n', 'th\u00e1nh thi\u1ec7n', 'quy\u1ebfn luy\u1ebfn'),
    viProgressionScreen('y\u00eau th\u01b0\u01a1ng', 'nghi\u00eam kh\u1eafc', 'ng\u01b0\u1ee3ng ng\u00f9ng'),
    viProgressionScreen('Hi\u1ec7n t\u1ea1i b\u00e9 \u0111ang bu\u1ed3n.'),
    viProgressionScreen('Em h\u1ea1nh ph\u00fac khi \u0111\u01b0\u1ee3c y\u00eau th\u01b0\u01a1ng.'),
    viProgressionScreen('B\u00e9 lu\u00f4n h\u1ea1nh ph\u00fac trong v\u00f2ng tay m\u1eb9.'),
    viProgressionScreen('Suy ngh\u0129 t\u00edch c\u1ef1c gi\u00fap b\u00e9 v\u01b0\u1ee3t kh\u00f3 kh\u0103n.')
  ]),
  'grade5-14-house-technology': Object.freeze([
    viProgressionScreen('\u1ea9', '\u1eab', '\u1ead'),
    viProgressionScreen('t\u1ee7', 'm\u00e3', 'l\u00f2'),
    viProgressionScreen('nh\u00e0', 'm\u00e1y', '\u0111\u00e8n'),
    viProgressionScreen('m\u1ea1ng', 's\u00f3ng', 'kh\u00f3a'),
    viProgressionScreen('ph\u00f2ng', 'thi\u1ebft', 'ngu\u1ed3n'),
    viProgressionScreen('chu\u00f4ng', 'gi\u01b0\u1eddng', 'truy\u1ec1n'),
    viProgressionScreen('m\u00e3 s\u1ed1', 't\u1ee7 \u0111\u1ed3', 't\u1ee7 g\u1ed7'),
    viProgressionScreen('nh\u00e0 c\u1eeda', 'b\u00e0n gh\u1ebf', '\u0111\u00e8n ng\u1ee7'),
    viProgressionScreen('kh\u00f3a \u0111i\u1ec7n', 'ph\u00e1t s\u00f3ng', 'b\u00f3ng \u0111i\u1ec7n'),
    viProgressionScreen('ph\u00f2ng kh\u00e1ch', 'ph\u00f2ng ri\u00eang', 'trang ho\u00e0ng'),
    viProgressionScreen('chu\u00f4ng c\u1eeda', 'gi\u01b0\u1eddng ng\u1ee7', 'truy\u1ec1n h\u00ecnh'),
    viProgressionScreen('Nh\u00e0 c\u1eeda g\u1ecdn g\u00e0ng.'),
    viProgressionScreen('C\u00f4ng ngh\u1ec7 gi\u00fap \u00edch cho \u0111\u1eddi s\u1ed1ng.'),
    viProgressionScreen('B\u00e9 h\u1ecdc c\u00e1ch d\u00f9ng m\u00e1y t\u00ednh an to\u00e0n.'),
    viProgressionScreen('\u0110\u1ed3 \u0111i\u1ec7n t\u1eed gi\u00fap cu\u1ed9c s\u1ed1ng ti\u1ec7n l\u1ee3i h\u01a1n.')
  ]),
  'grade5-15-safety-environment': Object.freeze([
    viProgressionScreen('\u00e9', '\u00e8', '\u1ebb', '\u1ebd', '\u1eb9'),
    viProgressionScreen('c\u1ecf', 'l\u00e1', '\u0111\u00ea'),
    viProgressionScreen('c\u00e2y', '\u0111\u1ea5t', 'r\u00e1c'),
    viProgressionScreen('kh\u00f3i', 'n\u01b0\u1edbc', 'r\u1eebng'),
    viProgressionScreen('nhi\u1ec5m', 'tr\u00e1nh', 'ph\u00f2ng'),
    viProgressionScreen('tr\u01b0\u1eddng', 'kho\u1ea3ng', 'tho\u00e1ng'),
    viProgressionScreen('c\u1ecf l\u00e1', 'b\u1edd \u0111\u00ea', 'b\u1edd k\u00e8'),
    viProgressionScreen('kh\u00ed \u0111\u1ed9c', 'v\u1ee9t r\u00e1c', 'c\u00e2y c\u1ed1i'),
    viProgressionScreen('n\u01b0\u1edbc s\u1ea1ch', 'r\u1eebng xanh', 'ch\u1eefa ch\u00e1y'),
    viProgressionScreen('ph\u00f2ng tr\u00e1nh', 'ph\u00f2ng ch\u1ed1ng', 'nhi\u1ec5m khu\u1ea9n'),
    viProgressionScreen('m\u00f4i tr\u01b0\u1eddng', 'kho\u1ea3ng xanh', 'tho\u00e1ng m\u00e1t'),
    viProgressionScreen('\u0110\u1eebng l\u00e0m \u00f4 nhi\u1ec5m kh\u00f4ng kh\u00ed.'),
    viProgressionScreen('M\u1ecdi ng\u01b0\u1eddi c\u00f9ng b\u1ea3o v\u1ec7 m\u00f4i tr\u01b0\u1eddng.'),
    viProgressionScreen('Tr\u1ed3ng nhi\u1ec1u c\u00e2y \u0111\u1ec3 c\u00f3 kh\u00f4ng kh\u00ed s\u1ea1ch.'),
    viProgressionScreen('Ph\u00e2n lo\u1ea1i r\u00e1c gi\u00fap m\u00f4i tr\u01b0\u1eddng xanh s\u1ea1ch \u0111\u1eb9p.')
  ]),
  'grade5-16-festivals-travel': Object.freeze([
    viProgressionScreen('\u1ebf', '\u1ec1', '\u1ec5', '\u1ec3', '\u1ec7'),
    viProgressionScreen('\u0111i', 'xa', '\u0111\u00f2'),
    viProgressionScreen('h\u1ed9i', 't\u00e0u', 'ph\u1ed1'),
    viProgressionScreen('c\u1ea3nh', 'bi\u1ec3n', 'r\u01b0\u1edbc'),
    viProgressionScreen('kh\u00e1ch', 'tr\u1ed1ng', 'th\u1eafng'),
    viProgressionScreen('chuy\u1ebfn', 'thuy\u1ec1n', 'truy\u1ec1n'),
    viProgressionScreen('\u0111i xa', '\u0111i \u0111\u00f2', 'v\u00e9 xe'),
    viProgressionScreen('ph\u1ed1 c\u1ed5', 'h\u1ed9i ch\u1ee3', 't\u00e0u bay'),
    viProgressionScreen('tham quan', 'danh lam', 'r\u01b0\u1edbc ki\u1ec7u'),
    viProgressionScreen('trang tr\u1ecdng', 'ho\u00e0ng th\u00e0nh', 'tr\u01b0\u1ee3t tuy\u1ebft'),
    viProgressionScreen('chuy\u1ebfn bay', 'thuy\u1ec1n r\u1ed3ng', 'truy\u1ec1n th\u1ed1ng'),
    viProgressionScreen('B\u00e9 r\u1ea5t th\u00edch \u0111i ch\u01a1i xa.'),
    viProgressionScreen('Ng\u00e0y h\u1ed9i l\u00e0ng em th\u1eadt nh\u1ed9n nh\u1ecbp.'),
    viProgressionScreen('B\u00e9 \u0111i ch\u01a1i xa ng\u1eafm nhi\u1ec1u c\u1ea3nh \u0111\u1eb9p.'),
    viProgressionScreen('Xem h\u1ed9i gi\u00fap em hi\u1ec3u v\u0103n h\u00f3a qu\u00ea m\u00ecnh.')
  ]),
  'grade5-17-review-home': Object.freeze([
    viProgressionScreen('\u00ed', '\u00ec', '\u1ec9', '\u0129', '\u1ecb'),
    viProgressionScreen('\u0103n', '\u00e1o', '\u0111i'),
    viProgressionScreen('h\u1ecdc', 'l\u00e0m', 'vui'),
    viProgressionScreen('s\u1ed1ng', 'kh\u1ecfe', 'ngh\u1ec9'),
    viProgressionScreen('ng\u01b0\u1eddi', 'thi\u1ec7n', 'ph\u00f2ng'),
    viProgressionScreen('khuy\u00ean', 'chuy\u1ec7n', 'nghi\u00eam'),
    viProgressionScreen('\u0103n no', '\u0111i b\u1ed9', 't\u1ee7 \u0111\u1ed3'),
    viProgressionScreen('h\u1ecdc t\u1eadp', 'gi\u1eef g\u00ecn', 'y\u00eau \u0111\u1eddi'),
    viProgressionScreen('cu\u1ed9c s\u1ed1ng', 'kh\u1ecfe m\u1ea1nh', 'ngh\u1ec9 ng\u01a1i'),
    viProgressionScreen('th\u00e0nh ng\u01b0\u1eddi', 'l\u01b0\u01a1ng thi\u1ec7n', 'ph\u00f2ng tr\u00e1nh'),
    viProgressionScreen('l\u1eddi khuy\u00ean', 'tr\u00f2 chuy\u1ec7n', 'nghi\u00eam t\u00fac'),
    viProgressionScreen('B\u00e9 tr\u00e2n tr\u1ecdng t\u1eebng ph\u00fat gi\u00e2y.'),
    viProgressionScreen('Ai ai c\u0169ng ch\u0103m ch\u1ec9 l\u00e0m vi\u1ec7c.'),
    viProgressionScreen('\u0102n u\u1ed1ng \u0111\u1ea7y \u0111\u1ee7 gi\u00fap b\u00e9 kh\u1ecfe m\u1ea1nh.'),
    viProgressionScreen('Ng\u01b0\u1eddi s\u1ed1ng nh\u00e2n h\u1eadu s\u1ebd g\u1eb7p nhi\u1ec1u \u0111i\u1ec1u may.')
  ]),
  'grade5-18-review-world': Object.freeze([
    viProgressionScreen('\u00f2', '\u00f3', '\u1ecf', '\u00f5', '\u1ecd'),
    viProgressionScreen('c\u00e1', 'c\u1ecf', '\u0111\u00e1'),
    viProgressionScreen('c\u00e2y', 'm\u00e2y', 'sao'),
    viProgressionScreen('s\u00f4ng', 'r\u1eebng', 'bi\u1ec3n'),
    viProgressionScreen('tr\u0103ng', 's\u01b0\u01a1ng', 'ngu\u1ed3n'),
    viProgressionScreen('thuy\u1ec1n', 'ph\u01b0\u1ee3ng', 'nguy\u1ec7t'),
    viProgressionScreen('c\u00e1 r\u00f4', 'c\u1ecf g\u00e0', 'b\u1edd h\u1ed3'),
    viProgressionScreen('c\u00e2y c\u1ed1i', 'm\u00e2y bay', 'sao mai'),
    viProgressionScreen('r\u1eebng xanh', 's\u00f4ng r\u1ed9ng', 'bi\u1ec3n kh\u01a1i'),
    viProgressionScreen('thi\u00ean nhi\u00ean', 'tr\u0103ng thanh', 's\u01b0\u01a1ng tr\u1eafng'),
    viProgressionScreen('con thuy\u1ec1n', 'hoa ph\u01b0\u1ee3ng', '\u00e1nh nguy\u1ec7t'),
    viProgressionScreen('Tr\u00e1i \u0110\u1ea5t c\u1ee7a em r\u1ea5t \u0111\u1eb9p.'),
    viProgressionScreen('Th\u1ebf gi\u1edbi t\u1ef1 nhi\u00ean th\u1eadt tuy\u1ec7t v\u1eddi.'),
    viProgressionScreen('Thi\u00ean nhi\u00ean quanh em c\u00f3 nhi\u1ec1u m\u00e0u s\u1eafc.'),
    viProgressionScreen('B\u00e9 c\u00f9ng m\u1ecdi ng\u01b0\u1eddi b\u1ea3o v\u1ec7 h\u00e0nh tinh xanh.')
  ]),
  'grade5-19-review-community': Object.freeze([
    viProgressionScreen('\u1ed3', '\u1ed1', '\u1ed7', '\u1ed5', '\u1ed9'),
    viProgressionScreen('c\u00f4', 'h\u1ed9', '\u0111\u00ea'),
    viProgressionScreen('d\u00e2n', 'ph\u1ed1', 'x\u00f3m'),
    viProgressionScreen('l\u00e0ng', '\u0111\u1ed3ng', 'th\u00f4n'),
    viProgressionScreen('ng\u01b0\u1eddi', 'chung', 'tr\u00e1ch'),
    viProgressionScreen('ph\u01b0\u1eddng', 'th\u01b0\u01a1ng', 'nh\u01b0\u1eddng'),
    viProgressionScreen('c\u00f4 d\u00ec', 't\u1ed5 \u1ea5m', 'h\u1ed9 \u0111\u00ea'),
    viProgressionScreen('d\u00e2n ph\u1ed1', 'l\u1ed1i x\u00f3m', 'h\u1ed9i h\u1ecdp'),
    viProgressionScreen('c\u1ed9ng \u0111\u1ed3ng', 'th\u00f4n l\u00e0ng', 'gi\u00fap nhau'),
    viProgressionScreen('ng\u01b0\u1eddi ngh\u00e8o', 'chung quanh', 'tr\u00e1ch nhi\u1ec7m'),
    viProgressionScreen('ph\u1ed1 ph\u01b0\u1eddng', 'y\u00eau th\u01b0\u01a1ng', 'nh\u01b0\u1eddng nh\u1ecbn'),
    viProgressionScreen('L\u00e0ng x\u00f3m lu\u00f4n gi\u00fap \u0111\u1ee1 nhau.'),
    viProgressionScreen('Ch\u00fang ta n\u00ean bi\u1ebft y\u00eau th\u01b0\u01a1ng nhau.'),
    viProgressionScreen('C\u00f9ng nhau gi\u1eef khu ph\u1ed1 lu\u00f4n s\u1ea1ch \u0111\u1eb9p.'),
    viProgressionScreen('L\u00e0m nhi\u1ec1u vi\u1ec7c thi\u1ec7n gi\u00fap \u0111\u1ee1 ng\u01b0\u1eddi kh\u00f3 kh\u0103n.')
  ]),
  'grade5-20-final': Object.freeze([
    viProgressionScreen('\u1edb', '\u1edd', '\u1edf', '\u1ee1', '\u1ee3'),
    viProgressionScreen('ba', 'm\u1eb9', 'xe', 'c\u00e1', '\u0111i', '\u0111\u1ecf'),
    viProgressionScreen('con', 'b\u00e0n', 'tay', 'ch\u00f3', 's\u1eefa', 'n\u00fai'),
    viProgressionScreen('s\u00e1ch', 'chim', 'b\u00e1nh', 'xanh', 'r\u1eebng', 'b\u00f3ng'),
    viProgressionScreen('ng\u01b0\u1eddi', 'ngoan', 'trong', 'chu\u1ed9t', 'tr\u1eafng', 'nhi\u1ec1u'),
    viProgressionScreen('tr\u01b0\u1eddng', 'gi\u01b0\u1eddng', 'th\u01b0\u01a1ng', 'nghi\u00eam', 'khuy\u00ean', 'truy\u1ec7n'),
    viProgressionScreen('ba m\u1eb9', '\u0111i xe', 'lo xa', '\u0111i b\u1ed9', 'xe ga'),
    viProgressionScreen('cha con', 'b\u00e0n gh\u1ebf', 'n\u00fai \u0111\u1ed3i', 'heo con', 'h\u1ecdc t\u1eadp'),
    viProgressionScreen('gi\u00e1o vi\u00ean', 's\u00e1ch d\u1ecbch', 'hi\u1ebfu th\u1ea3o', 'ti\u1ebft ki\u1ec7m'),
    viProgressionScreen('ng\u01b0\u1eddi ngh\u00e8o', 'tr\u1ed3ng chu\u1ed1i', 'tr\u1eafng trong'),
    viProgressionScreen('thuy\u1ec1n tr\u01b0\u1edfng', 'th\u01b0\u01a1ng th\u01b0\u01a1ng', 'truy\u1ec1n thuy\u1ebft'),
    viProgressionScreen('Ba m\u1eb9 y\u00eau con.', 'Em ch\u0103m h\u1ecdc b\u00e0i.', 'Su\u1ed1i ch\u1ea3y r\u00f3c r\u00e1ch.', 'B\u00e9 r\u1ea5t vui v\u1ebb.', 'H\u1ed9i l\u00e0ng t\u01b0ng b\u1eebng.'),
    viProgressionScreen('\u1ede tr\u01b0\u1eddng em l\u00e0 h\u1ecdc sinh ngoan.', 'T\u1eadp th\u1ec3 d\u1ee5c gi\u00fap b\u00e9 th\u00eam kh\u1ecfe.', 'B\u00e9 lu\u00f4n tu\u00e2n th\u1ee7 lu\u1eadt giao th\u00f4ng.', 'B\u00e9 kh\u00f4ng ph\u1ee5 thu\u1ed9c v\u00e0o m\u00e1y t\u00ednh.', 'M\u1ecdi ng\u01b0\u1eddi c\u00f9ng b\u1ea3o v\u1ec7 Tr\u00e1i \u0110\u1ea5t.'),
    viProgressionScreen('Qu\u00ea h\u01b0\u01a1ng em c\u00f3 r\u1eebng xanh bi\u1ec3n r\u1ed9ng.', '\u0110\u1ecdc s\u00e1ch gi\u00fap tinh th\u1ea7n lu\u00f4n s\u1ea3ng kho\u00e1i.', 'B\u00e9 s\u1ed1ng trong t\u00ecnh y\u00eau c\u1ee7a m\u1ecdi ng\u01b0\u1eddi.', 'B\u00e9 c\u00f9ng b\u1ea1n tr\u1ed3ng c\u00e2y cho b\u00f3ng m\u00e1t.', 'B\u00e9 r\u1ea5t th\u00edch \u0111i xem h\u1ed9i d\u00e2n gian.'),
    viProgressionScreen('H\u1ecdc gi\u1ecfi ti\u1ebfng Anh gi\u00fap em th\u00eam t\u1ef1 tin.', 'B\u00e9 nh\u1edb t\u1eaft v\u00f2i n\u01b0\u1edbc sau khi d\u00f9ng xong.', 'Nh\u1eefng \u0111i\u1ec7u nh\u1ea1c vui gi\u00fap b\u00e9 th\u00eam y\u00eau \u0111\u1eddi.', 'B\u00e9 lu\u00f4n nh\u1edb \u01a1n nh\u1eefng ng\u01b0\u1eddi gi\u00fap \u0111\u1ee1 m\u00ecnh.', 'T\u1ef1 d\u1ecdn ph\u00f2ng gi\u00fap b\u00e9 r\u00e8n t\u00ednh ng\u0103n n\u1eafp')
  ]),
  'grade5-21-science-space': Object.freeze([
    viProgressionScreen('kĩ sư', 'vĩ mô', 'cỗ xe', 'cơ khí', 'kĩ thuật', 'công nghệ', 'máy móc', 'chế tạo'),
    viProgressionScreen('ngôi sao', 'bay cao', 'sấm sét', 'mây bay', 'vũ trụ', 'phi thuyền', 'bầu trời', 'phi công'),
    viProgressionScreen('thực hành', 'toán học', 'hình khối', 'toán hình', 'khoa học', 'thí nghiệm', 'nghiên cứu', 'tìm tòi'),
    viProgressionScreen('không gian', 'chính tuyến', 'phong phú', 'khí quyển', 'vệ tinh', 'quỹ đạo', 'thiên thạch', 'hành tinh'),
    viProgressionScreen('truyền thuyết', 'chương trình', 'thương hiệu', 'sự nghiệp', 'phát minh', 'tri thức', 'học vấn', 'tài liệu'),
    viProgressionScreen('Vũ trụ thật bao la.', 'Trái Đất quay quanh mặt trời.', 'Các vì sao sáng lấp lánh.', 'Ánh trăng chiếu rọi màn đêm.', 'Hành tinh này tuyệt đẹp.', 'Tàu vũ trụ bay rất nhanh.', 'Hệ mặt trời rộng lớn.', 'Phi hành gia bay vào vũ trụ.'),
    viProgressionScreen('Chúng ta đang sống trên Trái Đất.', 'Khoa học giúp bé hiểu về vũ trụ .', 'Kính thiên văn nhìn được rất xa.', 'Vệ tinh giúp chụp ảnh Trái Đất.', 'Mặt Trăng luôn quay quanh Trái Đất.', 'Mặt trời chiếu sáng cho Trái Đất.', 'Lực hút Trái Đất giữ mọi vật.', 'Bầu khí quyển bảo vệ chúng ta.'),
    viProgressionScreen('Tàu vũ trụ bay vút vào không gian.', 'Kính viễn vọng giúp quan sát thiên hà .', 'Con người luôn muốn khám phá vũ trụ.', 'Vũ trụ bao la có nhiều bí ẩn.', 'Con người đã đặt chân lên Mặt Trăng.', 'Robot tự hành lấy đất trên Sao Hỏa.', 'Phi hành gia học cách sống lơ lửng.', 'Nhà du hành sống trên trạm không gian.'),
    viProgressionScreen('Những vệt sao băng lướt qua bầu trời đêm.', 'Dải ngân hà lấp lánh như dòng sông bạc.', 'Màn đêm ôm trọn muôn ngàn vì tinh tú.', 'Bé gửi ước mơ bay cùng những vì sao.', 'Nhà khoa học tìm sự sống ngoài Trái Đất.', 'Bé mơ ước lớn lên làm phi hành gia.', 'Học sinh rất thích môn khoa học vũ trụ.', 'Vầng trăng sáng vằng vặc giữa bầu trời đêm.')
  ]),
});

const viProgressionTranslation = (en, id) => Object.freeze({ en, id });
export const GRADE5_VI_PROGRESSION_TRANSLATIONS = Object.freeze({
  '\u00f4': viProgressionTranslation('oh', 'oh'),
  '\u00fd': viProgressionTranslation('meaning', 'makna'),
  '\u1edf': viProgressionTranslation('stay', 'tinggal'),
  ba: viProgressionTranslation('father', 'ayah'),
  m\u1eb9: viProgressionTranslation('mother', 'ibu'),
  b\u00e9: viProgressionTranslation('small child', 'anak kecil'),
  cha: viProgressionTranslation('father', 'ayah'),
  con: viProgressionTranslation('child', 'anak'),
  anh: viProgressionTranslation('older brother', 'kakak laki-laki'),
  s\u00e1ch: viProgressionTranslation('book', 'buku'),
  b\u1ea3ng: viProgressionTranslation('board', 'papan tulis'),
  th\u00e2n: viProgressionTranslation('body', 'tubuh'),
  ng\u01b0\u1eddi: viProgressionTranslation('person', 'orang'),
  ngoan: viProgressionTranslation('well-behaved', 'baik'),
  ngo\u00e0i: viProgressionTranslation('outside', 'di luar'),
  tr\u01b0\u1eddng: viProgressionTranslation('school', 'sekolah'),
  gi\u01b0\u1eddng: viProgressionTranslation('bed', 'tempat tidur'),
  th\u01b0\u01a1ng: viProgressionTranslation('love', 'sayang'),
  '\u0111i': viProgressionTranslation('go', 'pergi'),
  xe: viProgressionTranslation('vehicle', 'kendaraan'),
  c\u00f4: viProgressionTranslation('aunt or teacher', 'bibi atau guru'),
  ch\u1ecb: viProgressionTranslation('older sister', 'kakak perempuan'),
  b\u00e0n: viProgressionTranslation('desk', 'meja'),
  gh\u1ebf: viProgressionTranslation('chair', 'kursi'),
  ch\u00e2n: viProgressionTranslation('leg', 'kaki'),
  l\u01b0ng: viProgressionTranslation('back', 'punggung'),
  b\u1ee5ng: viProgressionTranslation('belly', 'perut'),
  r\u0103ng: viProgressionTranslation('tooth', 'gigi'),
  trong: viProgressionTranslation('inside', 'di dalam'),
  th\u00f4ng: viProgressionTranslation('clear', 'jelas'),
  nhanh: viProgressionTranslation('fast', 'cepat'),
  khuy\u00ean: viProgressionTranslation('advise', 'menasihati'),
  truy\u1ec7n: viProgressionTranslation('story', 'cerita'),
  truy\u1ec1n: viProgressionTranslation('transmit', 'menyampaikan'),
  t\u1ee7: viProgressionTranslation('cabinet', 'lemari'),
  '\u0103n': viProgressionTranslation('eat', 'makan'),
  b\u00fat: viProgressionTranslation('pen', 'pulpen'),
  k\u00ednh: viProgressionTranslation('glasses', 'kacamata'),
  khu\u00f4n: viProgressionTranslation('mold', 'cetakan'),
  nghi\u00eam: viProgressionTranslation('strict', 'tegas'),
  s\u01a1: viProgressionTranslation('simple', 'sederhana'),
  s\u1ed1: viProgressionTranslation('number', 'angka'),
  '\u0111\u1ecdc': viProgressionTranslation('read', 'membaca'),
  h\u1ecdc: viProgressionTranslation('study', 'belajar'),
  m\u1ef1c: viProgressionTranslation('ink', 'tinta'),
  da: viProgressionTranslation('skin', 'kulit'),
  eo: viProgressionTranslation('waist', 'pinggang'),
  c\u1ed5: viProgressionTranslation('neck', 'leher'),
  '\u00e1o': viProgressionTranslation('shirt', 'baju'),
  m\u0169: viProgressionTranslation('hat', 'topi'),
  v\u1edb: viProgressionTranslation('socks', 'kaus kaki'),
  tay: viProgressionTranslation('hand', 'tangan'),
  tai: viProgressionTranslation('ear', 'telinga'),
  t\u00f3c: viProgressionTranslation('hair', 'rambut'),
  m\u1eaft: viProgressionTranslation('eye', 'mata'),
  m\u0169i: viProgressionTranslation('nose', 'hidung'),
  mi\u1ec7ng: viProgressionTranslation('mouth', 'mulut'),
  qu\u1ea7n: viProgressionTranslation('trousers', 'celana'),
  kho\u00e1c: viProgressionTranslation('coat', 'mantel'),
  cho\u00e0ng: viProgressionTranslation('wrap', 'menyelimutkan'),
  v\u1ea1t: viProgressionTranslation('hem', 'ujung baju'),
  '\u0111\u00f9i': viProgressionTranslation('thigh', 'paha'),
  vai: viProgressionTranslation('shoulder', 'bahu'),
  m\u00f4i: viProgressionTranslation('lip', 'bibir'),
  s\u1ed1ng: viProgressionTranslation('spine', 'tulang belakang'),
  ng\u1ef1c: viProgressionTranslation('chest', 'dada'),
  d\u00e0i: viProgressionTranslation('long', 'panjang'),
  v\u00e1y: viProgressionTranslation('skirt', 'rok'),
  '\u0111\u1ea7m': viProgressionTranslation('dress', 'gaun'),
  g\u0103ng: viProgressionTranslation('glove', 'sarung tangan'),
  t\u1ea5t: viProgressionTranslation('sock', 'kaus kaki'),
  kh\u0103n: viProgressionTranslation('scarf', 'syal'),
  len: viProgressionTranslation('wool', 'wol'),
  ho: viProgressionTranslation('cough', 'batuk'),
  b\u1ed5: viProgressionTranslation('nutritious', 'bergizi'),
  th\u00fa: viProgressionTranslation('animal', 'hewan'),
  b\u00f2: viProgressionTranslation('cow', 'sapi'),
  d\u00ea: viProgressionTranslation('goat', 'kambing'),
  c\u00e1: viProgressionTranslation('fish', 'ikan'),
  heo: viProgressionTranslation('pig', 'babi'),
  ch\u00f3: viProgressionTranslation('dog', 'anjing'),
  m\u00e8o: viProgressionTranslation('cat', 'kucing'),
  chim: viProgressionTranslation('bird', 'burung'),
  ng\u1ef1a: viProgressionTranslation('horse', 'kuda'),
  b\u1ec7nh: viProgressionTranslation('illness', 'penyakit'),
  thu\u1ed1c: viProgressionTranslation('medicine', 'obat'),
  kh\u00e1m: viProgressionTranslation('examine', 'memeriksa'),
  chu\u1ed9t: viProgressionTranslation('mouse', 'tikus'),
  kh\u1ecfe: viProgressionTranslation('healthy', 'sehat'),
  d\u01b0\u1ee1ng: viProgressionTranslation('nourish', 'merawat'),
  khu\u1ea9n: viProgressionTranslation('bacteria', 'bakteri'),
  g\u00e0: viProgressionTranslation('chicken', 'ayam'),
  v\u1ecbt: viProgressionTranslation('duck', 'bebek'),
  s\u1ed1t: viProgressionTranslation('fever', 'demam'),
  tim: viProgressionTranslation('heart', 'jantung'),
  gan: viProgressionTranslation('liver', 'hati'),
  th\u1ec3: viProgressionTranslation('body', 'tubuh'),
  thao: viProgressionTranslation('sport', 'olahraga'),
  s\u1ee9c: viProgressionTranslation('strength', 'kekuatan'),
  b\u1ec1n: viProgressionTranslation('endurance', 'daya tahan'),
  ch\u1ea1y: viProgressionTranslation('run', 'berlari'),
  b\u1ed9: viProgressionTranslation('on foot', 'berjalan kaki'),
  b\u1ea1ch: viProgressionTranslation('white', 'putih'),
  b\u1ed3i: viProgressionTranslation('nourish', 'memelihara'),
  ti\u00eam: viProgressionTranslation('inject', 'menyuntik'),
  ph\u00f2ng: viProgressionTranslation('prevent', 'mencegah'),
  dinh: viProgressionTranslation('nutrition', 'gizi'),
  a: viProgressionTranslation('a', 'a'),
  '\u0103': viProgressionTranslation('\u0103', '\u0103'),
  '\u00e2': viProgressionTranslation('\u00e2', '\u00e2'),
  '\u0111': viProgressionTranslation('\u0111', '\u0111'),
  e: viProgressionTranslation('e', 'e'),
  '\u00ea': viProgressionTranslation('\u00ea', '\u00ea'),
  i: viProgressionTranslation('i', 'i'),
  o: viProgressionTranslation('o', 'o'),
  '\u00f4': viProgressionTranslation('\u00f4', '\u00f4'),
  u: viProgressionTranslation('u', 'u'),
  '\u01a1': viProgressionTranslation('\u01a1', '\u01a1'),
  '\u01b0': viProgressionTranslation('\u01b0', '\u01b0'),
  b: viProgressionTranslation('letter b', 'huruf b'),
  c: viProgressionTranslation('letter c', 'huruf c'),
  d: viProgressionTranslation('letter d', 'huruf d'),
  g: viProgressionTranslation('letter g', 'huruf g'),
  h: viProgressionTranslation('letter h', 'huruf h'),
  y: viProgressionTranslation('letter y', 'huruf y'),
  th\u1ea7y: viProgressionTranslation('teacher', 'guru'),
  th\u01b0\u1edbc: viProgressionTranslation('ruler', 'penggaris'),
  '\u0111\u00ec': viProgressionTranslation('aunt', 'bibi'),
  hi\u1ec1n: viProgressionTranslation('kind', 'baik hati'),
  gi\u00e1o: viProgressionTranslation('education', 'pendidikan'),
  vi\u00ean: viProgressionTranslation('member', 'anggota'),
  ph\u01b0\u1ee3ng: viProgressionTranslation('flamboyant tree', 'pohon flamboyan'),
  chuy\u1ec7n: viProgressionTranslation('story', 'cerita'),
  v\u1edf: viProgressionTranslation('notebook', 'buku tulis'),
  ph\u1ea5n: viProgressionTranslation('chalk', 'kapur'),
  ph\u00f2ng: viProgressionTranslation('room', 'ruangan'),
  gi\u1ea3ng: viProgressionTranslation('lecture', 'mengajar'),
  v\u1ebd: viProgressionTranslation('draw', 'menggambar'),
  '\u0111\u1ed3': viProgressionTranslation('things', 'barang'),
  b\u00e0i: viProgressionTranslation('lesson', 'pelajaran'),
  vi\u1ebft: viProgressionTranslation('write', 'menulis'),
  sinh: viProgressionTranslation('birth', 'lahir'),
  ho\u1ea1t: viProgressionTranslation('activity', 'kegiatan'),
  th\u1eb3ng: viProgressionTranslation('straight', 'lurus'),
  tranh: viProgressionTranslation('picture', 'gambar'),
  t\u01b0\u1eddng: viProgressionTranslation('wall', 'dinding'),
  h\u00ecnh: viProgressionTranslation('shape', 'bentuk'),
  nhu\u1ed9m: viProgressionTranslation('dye', 'mewarnai'),
  tr\u1eafng: viProgressionTranslation('white', 'putih'),
  khuy\u1ebft: viProgressionTranslation('defect', 'cacat'),
  vi\u00eam: viProgressionTranslation('inflammation', 'radang'),
  m\u1ea1nh: viProgressionTranslation('strong', 'kuat'),
  c\u00fan: viProgressionTranslation('puppy', 'anak anjing'),
  tr\u00f9ng: viProgressionTranslation('germ', 'kuman'),
  '\u01a1': viProgressionTranslation('ơ', 'ơ'),
  c\u01a1m: viProgressionTranslation('rice', 'nasi'),
  rau: viProgressionTranslation('vegetables', 'sayuran'),
  b\u00fan: viProgressionTranslation('rice noodles', 'bihun'),
  b\u00e1nh: viProgressionTranslation('cake', 'kue'),
  n\u01b0\u1edbc: viProgressionTranslation('water', 'air'),
  th\u1ecbt: viProgressionTranslation('meat', 'daging'),
  tr\u1ee9ng: viProgressionTranslation('egg', 'telur'),
  chu\u1ed1i: viProgressionTranslation('banana', 'pisang'),
  n\u01b0\u1edbng: viProgressionTranslation('grill', 'memanggang'),
  x\u00f4i: viProgressionTranslation('sticky rice', 'ketan'),
  canh: viProgressionTranslation('soup', 'sup'),
  ch\u00e1o: viProgressionTranslation('porridge', 'bubur'),
  v\u01b0\u1ee3n: viProgressionTranslation('gibbon', 'owa'),
  ngu\u1ed3n: viProgressionTranslation('source', 'sumber'),
  kho\u00e1ng: viProgressionTranslation('mineral', 'mineral'),
  '\u0111\u00e1': viProgressionTranslation('ice or stone', 'es atau batu'),
  ly: viProgressionTranslation('glass', 'gelas'),
  '\u0111\u1ecf': viProgressionTranslation('red', 'merah'),
  s\u1eefa: viProgressionTranslation('milk', 'susu'),
  cam: viProgressionTranslation('orange', 'jeruk'),
  tr\u00e0: viProgressionTranslation('tea', 'teh'),
  xanh: viProgressionTranslation('blue or green', 'biru atau hijau'),
  h\u1ed3ng: viProgressionTranslation('pink', 'merah muda'),
  v\u00e0ng: viProgressionTranslation('yellow', 'kuning'),
  chanh: viProgressionTranslation('lemon', 'lemon'),
  thanh: viProgressionTranslation('pure', 'murni'),
  khi\u1ebft: viProgressionTranslation('flawless', 'tanpa cela'),
  '\u0111\u00e0o': viProgressionTranslation('peach', 'persik'),
  b\u01b0\u1edfi: viProgressionTranslation('pomelo', 'jeruk bali')
});

// Four contextual sentence targets are reserved for screens 12-15 of every
// grade-5 lesson. Keeping them keyed by lesson id makes the sequence stable,
// translatable and independent from the random vocabulary bank.
export const GRADE5_SENTENCE_LIBRARY = Object.freeze({
  'grade5-01-family-school': sentencePack(
    sentence('Ba m\u1eb9 y\u00eau con.', 'Parents love their child.', 'Orang tua menyayangi anak.'),
    sentence('Em l\u00e0 h\u1ecdc sinh ngoan.', 'I am a well-behaved student.', 'Saya siswa yang baik.'),
    sentence('Gia \u0111\u00ecnh em lu\u00f4n tr\u00e0n ng\u1eadp ni\u1ec1m vui.', 'My family is always full of joy.', 'Keluarga saya selalu penuh kebahagiaan.'),
    sentence('M\u00e1i tr\u01b0\u1eddng th\u00e2n y\u00eau l\u00e0 n\u01a1i em h\u1ecdc t\u1eadp.', 'My beloved school is where I study.', 'Sekolah tercinta adalah tempat saya belajar.')
  ),
  'grade5-02-classroom-home': sentencePack(
    sentence('Em ng\u1ed3i h\u1ecdc b\u00e0i.', 'I sit and study.', 'Saya duduk dan belajar.'),
    sentence('H\u1ecdc sinh gi\u1eef l\u1edbp s\u1ea1ch \u0111\u1eb9p.', 'Students keep the classroom clean and beautiful.', 'Siswa menjaga kelas tetap bersih dan indah.'),
    sentence('Ch\u00fang em lu\u00f4n lu\u00f4n k\u00ednh tr\u1ecdng th\u1ea7y c\u00f4.', 'We always respect our teachers.', 'Kami selalu menghormati guru kami.'),
    sentence('Ch\u00fang em h\u0103ng h\u00e1i ph\u00e1t bi\u1ec3u x\u00e2y d\u1ef1ng b\u00e0i.', 'We eagerly raise our hands and contribute to the lesson.', 'Kami bersemangat menjawab dan membangun pelajaran.')
  ),
  'grade5-03-clothes-body': sentencePack(
    sentence('\u00c1o qu\u1ea7n s\u1ea1ch \u0111\u1eb9p.', 'Clothes are clean and neat.', 'Pakaian bersih dan rapi.'),
    sentence('Em gi\u1eef v\u1ec7 sinh th\u00e2n th\u1ec3.', 'I keep my body clean.', 'Saya menjaga kebersihan tubuh.'),
    sentence('B\u00e9 gi\u1eef g\u00ecn \u0111\u00f4i b\u00e0n tay s\u1ea1ch s\u1ebd.', 'The child keeps both hands clean.', 'Anak itu menjaga kedua tangannya tetap bersih.'),
    sentence('M\u1eb7c trang ph\u1ee5c g\u1ecdn g\u00e0ng gi\u00fap em t\u1ef1 tin.', 'Neat clothing helps me feel confident.', 'Pakaian yang rapi membuat saya percaya diri.')
  ),
  'grade5-04-health-animals': sentencePack(
    sentence('Ch\u00fa ch\u00f3 con ch\u1ea1y tung t\u0103ng.', 'The puppy runs around happily.', 'Anak anjing itu berlari dengan riang.'),
    sentence('T\u1eadp th\u1ec3 d\u1ee5c gi\u00fap c\u01a1 th\u1ec3 kh\u1ecfe.', 'Exercise helps the body stay healthy.', 'Olahraga membantu tubuh tetap sehat.'),
    sentence('Em y\u00eau qu\u00fd v\u00e0 ch\u0103m s\u00f3c \u0111\u1ed9ng v\u1eadt.', 'I love and care for animals.', 'Saya menyayangi dan merawat hewan.'),
    sentence('\u0102n u\u1ed1ng \u0111\u1ee7 ch\u1ea5t v\u00e0 r\u00e8n luy\u1ec7n th\u1ec3 thao.', 'Eat a balanced diet and exercise.', 'Makan bergizi dan berolahraga.')
  ),
  'grade5-05-pets-food': sentencePack(
    sentence('M\u00e8o con \u0103n c\u01a1m.', 'The kitten eats rice.', 'Anak kucing makan nasi.'),
    sentence('M\u00f3n \u0103n m\u1eb9 n\u1ea5u r\u1ea5t ngon.', 'The meal Mom cooks is delicious.', 'Masakan Ibu sangat enak.'),
    sentence('Ch\u0103m s\u00f3c th\u00fa c\u01b0ng trong gia \u0111\u00ecnh.', 'Care for pets in the family.', 'Rawat hewan peliharaan dalam keluarga.'),
    sentence('Th\u01b0\u1edfng th\u1ee9c nh\u1eefng m\u00f3n \u0103n b\u1ed5 d\u01b0\u1ee1ng.', 'Enjoy nutritious foods.', 'Nikmati makanan bergizi.')
  ),
  'grade5-06-drinks-colors': sentencePack(
    sentence('U\u1ed1ng n\u01b0\u1edbc cam t\u01b0\u01a1i.', 'Drink fresh orange juice.', 'Minumlah jus jeruk segar.'),
    sentence('Ly n\u01b0\u1edbc cam c\u00f3 m\u00e0u v\u00e0ng t\u01b0\u01a1i.', 'The orange juice is bright yellow.', 'Jus jeruk itu berwarna kuning cerah.'),
    sentence('B\u1ee9c tranh m\u00e0u s\u1eafc r\u1ef1c r\u1ee1 sinh \u0111\u1ed9ng.', 'The colorful picture is vivid and lively.', 'Gambar penuh warna itu cerah dan hidup.'),
    sentence('U\u1ed1ng \u0111\u1ee7 n\u01b0\u1edbc m\u1ed7i ng\u00e0y gi\u00fap kh\u1ecfe m\u1ea1nh.', 'Drinking enough water every day helps you stay healthy.', 'Minum cukup air setiap hari membantu tetap sehat.')
  ),
  'grade5-07-numbers-time': sentencePack(
    sentence('Em ch\u0103m ch\u1ec9 t\u1eadp xem gi\u1edd.', 'I diligently practice telling time.', 'Saya rajin berlatih membaca jam.'),
    sentence('M\u1ed9t ng\u00e0y c\u00f3 hai m\u01b0\u01a1i t\u01b0 gi\u1edd.', 'A day has twenty-four hours.', 'Satu hari memiliki dua puluh empat jam.'),
    sentence('Th\u1eddi gian tr\u00f4i qua nhanh ch\u00f3ng.', 'Time passes quickly.', 'Waktu berlalu dengan cepat.'),
    sentence('H\u1ecdc c\u00e1ch qu\u1ea3n l\u00fd th\u1eddi gian hi\u1ec7u qu\u1ea3.', 'Learn to manage time effectively.', 'Belajar mengelola waktu secara efektif.')
  ),
  'grade5-08-calendar-weather': sentencePack(
    sentence('H\u00f4m nay tr\u1eddi n\u1eafng.', 'It is sunny today.', 'Hari ini cuaca cerah.'),
    sentence('Th\u1eddi ti\u1ebft m\u00f9a thu r\u1ea5t m\u00e1t m\u1ebb.', 'The autumn weather is very cool.', 'Cuaca musim gugur sangat sejuk.'),
    sentence('Xem l\u1ecbch \u0111\u1ec3 bi\u1ebft c\u00e1c ng\u00e0y ngh\u1ec9.', 'Check the calendar to know the holidays.', 'Lihat kalender untuk mengetahui hari libur.'),
    sentence('M\u00f9a xu\u00e2n v\u1ec1 mang \u0111\u1ebfn l\u00e0n gi\u00f3 m\u00e1t r\u01b0\u1ee3i.', 'Spring brings a refreshing breeze.', 'Musim semi membawa angin sejuk yang menyegarkan.')
  ),
  'grade5-09-nature-places': sentencePack(
    sentence('N\u00fai non r\u1ea5t h\u00f9ng v\u0129.', 'The mountains are magnificent.', 'Pegunungan sangat megah.'),
    sentence('C\u1ea3nh \u0111\u1eb9p thi\u00ean nhi\u00ean k\u1ef3 v\u0129.', 'The natural scenery is magnificent.', 'Pemandangan alam sangat indah.'),
    sentence('Em c\u00f9ng gia \u0111\u00ecnh \u0111i d\u1ea1o ch\u01a1i.', 'I go for a walk with my family.', 'Saya berjalan-jalan bersama keluarga.'),
    sentence('Ch\u00fang em gi\u1eef g\u00ecn v\u1ebb \u0111\u1eb9p c\u1ee7a qu\u00ea h\u01b0\u01a1ng.', 'We preserve the beauty of our homeland.', 'Kami menjaga keindahan tanah air kami.')
  ),
  'grade5-10-transport-community': sentencePack(
    sentence('Xe ch\u1ea1y tr\u00ean \u0111\u01b0\u1eddng.', 'The vehicle runs on the road.', 'Kendaraan melaju di jalan.'),
    sentence('M\u1ecdi ng\u01b0\u1eddi ch\u1ea5p h\u00e0nh lu\u1eadt giao th\u00f4ng.', 'Everyone obeys traffic laws.', 'Semua orang mematuhi peraturan lalu lintas.'),
    sentence('Em \u0111i b\u1ed9 sang \u0111\u01b0\u1eddng \u0111\u00fang v\u1ea1ch k\u1ebb.', 'I cross the road at the marked line.', 'Saya menyeberang di garis yang ditandai.'),
    sentence('\u0110i \u0111\u01b0\u1eddng an to\u00e0n l\u00e0 b\u1ea3o v\u1ec7 ch\u00ednh m\u00ecnh.', 'Safe travel protects yourself.', 'Berkendara aman melindungi diri sendiri.')
  ),
  'grade5-11-jobs-hobbies': sentencePack(
    sentence('B\u00e9 th\u00edch v\u1ebd tranh.', 'The child likes drawing pictures.', 'Anak itu suka menggambar.'),
    sentence('M\u1ed7i ngh\u1ec1 nghi\u1ec7p \u0111\u1ec1u r\u1ea5t qu\u00fd gi\u00e1.', 'Every profession is valuable.', 'Setiap profesi sangat berharga.'),
    sentence('Em ch\u0103m ch\u1ec9 h\u1ecdc t\u1eadp \u0111\u1ec3 l\u00e0m b\u00e1c s\u0129.', 'I study hard to become a doctor.', 'Saya rajin belajar untuk menjadi dokter.'),
    sentence('Nu\u00f4i d\u01b0\u1ee1ng \u01b0\u1edbc m\u01a1 v\u00e0 s\u1edf th\u00edch l\u00e0nh m\u1ea1nh.', 'Nurture healthy dreams and hobbies.', 'Kembangkan impian dan hobi yang sehat.')
  ),
  'grade5-12-sports-actions': sentencePack(
    sentence('Em t\u1eadp \u0111\u00e1 b\u00f3ng.', 'I practice football.', 'Saya berlatih sepak bola.'),
    sentence('Ch\u0103m ch\u1ec9 t\u1eadp th\u1ec3 d\u1ee5c m\u1ed7i ng\u00e0y.', 'Exercise diligently every day.', 'Rajinlah berolahraga setiap hari.'),
    sentence('Ch\u1ea1y b\u1ed9 bu\u1ed5i s\u00e1ng gi\u00fap b\u00e9 vui v\u1ebb.', 'Running in the morning makes the child happy.', 'Berlari pagi membuat anak itu gembira.'),
    sentence('Ch\u0103m t\u1eadp th\u1ec3 thao gi\u00fap c\u01a1 th\u1ec3 d\u1ebbo dai.', 'Regular sports make the body flexible and strong.', 'Rajin berolahraga membuat tubuh kuat dan lentur.')
  ),
  'grade5-13-feelings-adjectives': sentencePack(
    sentence('Hi\u1ec7n t\u1ea1i b\u00e9 \u0111ang bu\u1ed3n.', 'The child is sad right now.', 'Anak itu sedang sedih sekarang.'),
    sentence('Em h\u1ea1nh ph\u00fac khi \u0111\u01b0\u1ee3c y\u00eau th\u01b0\u01a1ng.', 'I am happy when I am loved.', 'Saya bahagia ketika disayangi.'),
    sentence('B\u00e9 lu\u00f4n h\u1ea1nh ph\u00fac trong v\u00f2ng tay m\u1eb9.', "The child is always happy in her mother's arms.", 'Anak itu selalu bahagia dalam pelukan ibunya.'),
    sentence('Suy ngh\u0129 t\u00edch c\u1ef1c gi\u00fap b\u00e9 v\u01b0\u1ee3t kh\u00f3 kh\u0103n.', 'Positive thinking helps the child overcome difficulties.', 'Pikiran positif membantu anak mengatasi kesulitan.')
  ),
  'grade5-14-house-technology': sentencePack(
    sentence('Nh\u00e0 c\u1eeda g\u1ecdn g\u00e0ng.', 'The house is tidy.', 'Rumah itu rapi.'),
    sentence('C\u00f4ng ngh\u1ec7 gi\u00fap \u00edch cho \u0111\u1eddi s\u1ed1ng.', 'Technology is useful for daily life.', 'Teknologi bermanfaat bagi kehidupan.'),
    sentence('B\u00e9 h\u1ecdc c\u00e1ch d\u00f9ng m\u00e1y t\u00ednh an to\u00e0n.', 'The child learns to use a computer safely.', 'Anak itu belajar menggunakan komputer dengan aman.'),
    sentence('\u0110\u1ed3 \u0111i\u1ec7n t\u1eed gi\u00fap cu\u1ed9c s\u1ed1ng ti\u1ec7n l\u1ee3i h\u01a1n.', 'Electronic devices make life more convenient.', 'Perangkat elektronik membuat hidup lebih nyaman.')
  ),
  'grade5-15-safety-environment': sentencePack(
    sentence('\u0110\u1eebng l\u00e0m \u00f4 nhi\u1ec5m kh\u00f4ng kh\u00ed.', 'Do not pollute the air.', 'Jangan mencemari udara.'),
    sentence('M\u1ecdi ng\u01b0\u1eddi c\u00f9ng b\u1ea3o v\u1ec7 m\u00f4i tr\u01b0\u1eddng.', 'Everyone helps protect the environment.', 'Semua orang ikut melindungi lingkungan.'),
    sentence('Tr\u1ed3ng nhi\u1ec1u c\u00e2y \u0111\u1ec3 c\u00f3 kh\u00f4ng kh\u00ed s\u1ea1ch.', 'Plant many trees for clean air.', 'Tanam banyak pohon untuk mendapatkan udara bersih.'),
    sentence('Ph\u00e2n lo\u1ea1i r\u00e1c gi\u00fap m\u00f4i tr\u01b0\u1eddng xanh s\u1ea1ch \u0111\u1eb9p.', 'Sorting waste helps keep the environment green and clean.', 'Memilah sampah membantu menjaga lingkungan tetap hijau dan bersih.')
  ),
  'grade5-16-festivals-travel': sentencePack(
    sentence('B\u00e9 r\u1ea5t th\u00edch \u0111i ch\u01a1i xa.', 'The child really likes going far away.', 'Anak itu sangat suka bepergian jauh.'),
    sentence('Ng\u00e0y h\u1ed9i l\u00e0ng em th\u1eadt nh\u1ed9n nh\u1ecbp.', 'The village festival is very lively.', 'Festival desa kami sangat meriah.'),
    sentence('B\u00e9 \u0111i ch\u01a1i xa ng\u1eafm nhi\u1ec1u c\u1ea3nh \u0111\u1eb9p.', 'The child travels far and sees many beautiful sights.', 'Anak itu bepergian jauh dan melihat banyak pemandangan indah.'),
    sentence('Xem h\u1ed9i gi\u00fap em hi\u1ec3u v\u0103n h\u00f3a qu\u00ea m\u00ecnh.', 'Watching festivals helps me understand my local culture.', 'Melihat festival membantu saya memahami budaya daerah saya.')
  ),
  'grade5-17-review-home': sentencePack(
    sentence('B\u00e9 tr\u00e2n tr\u1ecdng t\u1eebng ph\u00fat gi\u00e2y.', 'The child treasures every moment.', 'Anak itu menghargai setiap detik.'),
    sentence('Ai ai c\u0169ng ch\u0103m ch\u1ec9 l\u00e0m vi\u1ec7c.', 'Everyone works diligently.', 'Semua orang bekerja dengan rajin.'),
    sentence('\u0102n u\u1ed1ng \u0111\u1ea7y \u0111\u1ee7 gi\u00fap b\u00e9 kh\u1ecfe m\u1ea1nh.', 'Eating and drinking enough keeps the child healthy.', 'Makan dan minum cukup membuat anak sehat.'),
    sentence('Ng\u01b0\u1eddi s\u1ed1ng nh\u00e2n h\u1eadu s\u1ebd g\u1eb7p nhi\u1ec1u \u0111i\u1ec1u may.', 'Kind people will meet many good things.', 'Orang yang baik hati akan mengalami banyak keberuntungan.')
  ),
  'grade5-18-review-world': sentencePack(
    sentence('Tr\u00e1i \u0110\u1ea5t c\u1ee7a em r\u1ea5t \u0111\u1eb9p.', 'My Earth is very beautiful.', 'Bumi saya sangat indah.'),
    sentence('Th\u1ebf gi\u1edbi t\u1ef1 nhi\u00ean th\u1eadt tuy\u1ec7t v\u1eddi.', 'The natural world is wonderful.', 'Dunia alam sungguh luar biasa.'),
    sentence('Thi\u00ean nhi\u00ean quanh em c\u00f3 nhi\u1ec1u m\u00e0u s\u1eafc.', 'Nature around me has many colors.', 'Alam di sekitar saya memiliki banyak warna.'),
    sentence('B\u00e9 c\u00f9ng m\u1ecdi ng\u01b0\u1eddi b\u1ea3o v\u1ec7 h\u00e0nh tinh xanh.', 'The child and everyone protect the green planet.', 'Anak itu bersama semua orang melindungi planet hijau.')
  ),
  'grade5-19-review-community': sentencePack(
    sentence('L\u00e0ng x\u00f3m lu\u00f4n gi\u00fap \u0111\u1ee1 nhau.', 'Neighbors always help one another.', 'Tetangga selalu saling membantu.'),
    sentence('Ch\u00fang ta n\u00ean bi\u1ebft y\u00eau th\u01b0\u01a1ng nhau.', 'We should know how to love one another.', 'Kita harus saling menyayangi.'),
    sentence('C\u00f9ng nhau gi\u1eef khu ph\u1ed1 lu\u00f4n s\u1ea1ch \u0111\u1eb9p.', 'Together we keep the neighborhood clean and beautiful.', 'Bersama-sama kita menjaga lingkungan tetap bersih dan indah.'),
    sentence('L\u00e0m nhi\u1ec1u vi\u1ec7c thi\u1ec7n gi\u00fap \u0111\u1ee1 ng\u01b0\u1eddi kh\u00f3 kh\u0103n.', 'Doing good deeds helps people in difficulty.', 'Berbuat baik membantu orang yang kesulitan.')
  ),
  'grade5-20-final': sentencePack(
    sentence('Ba m\u1eb9 y\u00eau con.', 'Parents love their child.', 'Orang tua menyayangi anak.'),
    sentence('Em ch\u0103m h\u1ecdc b\u00e0i.', 'I study diligently.', 'Saya rajin belajar.'),
    sentence('Su\u1ed1i ch\u1ea3y r\u00f3c r\u00e1ch.', 'The stream babbles along.', 'Aliran sungai mengalir gemericik.'),
    sentence('B\u00e9 r\u1ea5t vui v\u1ebb.', 'The child is very cheerful.', 'Anak itu sangat ceria.'),
    sentence('H\u1ed9i l\u00e0ng t\u01b0ng b\u1eebng.', 'The village festival is bustling.', 'Festival desa sangat meriah.'),
    sentence('\u1ede tr\u01b0\u1eddng em l\u00e0 h\u1ecdc sinh ngoan.', 'At school, I am a well-behaved student.', 'Di sekolah, saya adalah siswa yang baik.'),
    sentence('T\u1eadp th\u1ec3 d\u1ee5c gi\u00fap b\u00e9 th\u00eam kh\u1ecfe.', 'Exercise makes the child healthier.', 'Berolahraga membuat anak lebih sehat.'),
    sentence('B\u00e9 lu\u00f4n tu\u00e2n th\u1ee7 lu\u1eadt giao th\u00f4ng.', 'The child always follows traffic laws.', 'Anak itu selalu mematuhi peraturan lalu lintas.'),
    sentence('B\u00e9 kh\u00f4ng ph\u1ee5 thu\u1ed9c v\u00e0o m\u00e1y t\u00ednh.', 'The child does not depend on the computer.', 'Anak itu tidak bergantung pada komputer.'),
    sentence('M\u1ecdi ng\u01b0\u1eddi c\u00f9ng b\u1ea3o v\u1ec7 Tr\u00e1i \u0110\u1ea5t.', 'Everyone protects the Earth together.', 'Semua orang bersama-sama melindungi Bumi.'),
    sentence('Qu\u00ea h\u01b0\u01a1ng em c\u00f3 r\u1eebng xanh bi\u1ec3n r\u1ed9ng.', 'My homeland has green forests and a wide sea.', 'Tanah air saya memiliki hutan hijau dan laut yang luas.'),
    sentence('\u0110\u1ecdc s\u00e1ch gi\u00fap tinh th\u1ea7n lu\u00f4n s\u1ea3ng kho\u00e1i.', 'Reading keeps the mind refreshed.', 'Membaca membuat pikiran tetap segar.'),
    sentence('B\u00e9 s\u1ed1ng trong t\u00ecnh y\u00eau c\u1ee7a m\u1ecdi ng\u01b0\u1eddi.', 'The child lives surrounded by everyone\'s love.', 'Anak itu hidup dalam kasih sayang semua orang.'),
    sentence('B\u00e9 c\u00f9ng b\u1ea1n tr\u1ed3ng c\u00e2y cho b\u00f3ng m\u00e1t.', 'The child plants trees with a friend for shade.', 'Anak itu menanam pohon bersama teman untuk berteduh.'),
    sentence('B\u00e9 r\u1ea5t th\u00edch \u0111i xem h\u1ed9i d\u00e2n gian.', 'The child really likes visiting folk festivals.', 'Anak itu sangat suka mengunjungi festival rakyat.'),
    sentence('H\u1ecdc gi\u1ecfi ti\u1ebfng Anh gi\u00fap em th\u00eam t\u1ef1 tin.', 'Being good at English makes me more confident.', 'Pandai berbahasa Inggris membuat saya lebih percaya diri.'),
    sentence('B\u00e9 nh\u1edb t\u1eaft v\u00f2i n\u01b0\u1edbc sau khi d\u00f9ng xong.', 'The child remembers to turn off the tap after use.', 'Anak itu ingat mematikan keran setelah digunakan.'),
    sentence('Nh\u1eefng \u0111i\u1ec7u nh\u1ea1c vui gi\u00fap b\u00e9 th\u00eam y\u00eau \u0111\u1eddi.', 'Cheerful music makes the child love life more.', 'Musik yang ceria membuat anak semakin mencintai hidup.'),
    sentence('B\u00e9 lu\u00f4n nh\u1edb \u01a1n nh\u1eefng ng\u01b0\u1eddi gi\u00fap \u0111\u1ee1 m\u00ecnh.', 'The child always remembers those who helped them.', 'Anak itu selalu mengingat orang-orang yang membantunya.'),
    sentence('T\u1ef1 d\u1ecdn ph\u00f2ng gi\u00fap b\u00e9 r\u00e8n t\u00ednh ng\u0103n n\u1eafp', 'Tidying the room helps the child become organized.', 'Merapikan kamar membantu anak menjadi rapi.')
  ),
  'grade5-21-science-space': sentencePack(
    sentence('Vũ trụ thật bao la.', 'The universe is truly vast.', 'Alam semesta sungguh luas.'),
    sentence('Trái Đất quay quanh mặt trời.', 'The Earth revolves around the sun.', 'Bumi berputar mengelilingi matahari.'),
    sentence('Các vì sao sáng lấp lánh.', 'The stars shine brightly.', 'Bintang-bintang bersinar terang.'),
    sentence('Ánh trăng chiếu rọi màn đêm.', 'Moonlight illuminates the night.', 'Cahaya bulan menerangi malam.'),
    sentence('Hành tinh này tuyệt đẹp.', 'This planet is magnificent.', 'Planet ini sangat indah.'),
    sentence('Tàu vũ trụ bay rất nhanh.', 'The spacecraft travels very fast.', 'Pesawat luar angkasa terbang sangat cepat.'),
    sentence('Hệ mặt trời rộng lớn.', 'The solar system is huge.', 'Tata surya sangat luas.'),
    sentence('Phi hành gia bay vào vũ trụ.', 'The astronaut flies into space.', 'Astronaut terbang ke luar angkasa.'),
    sentence('Chúng ta đang sống trên Trái Đất.', 'We live on Earth.', 'Kita hidup di Bumi.'),
    sentence('Khoa học giúp bé hiểu về vũ trụ .', 'Science helps the child understand the universe.', 'Sains membantu anak memahami alam semesta.'),
    sentence('Kính thiên văn nhìn được rất xa.', 'The telescope can see very far.', 'Teleskop dapat melihat rất xa.'),
    sentence('Vệ tinh giúp chụp ảnh Trái Đất.', 'Satellites help photograph the Earth.', 'Satelit membantu memotret Bumi.'),
    sentence('Mặt Trăng luôn quay quanh Trái Đất.', 'The Moon always orbits the Earth.', 'Bulan selalu mengorbit Bumi.'),
    sentence('Mặt trời chiếu sáng cho Trái Đất.', 'The sun provides light to the Earth.', 'Matahari menyinari Bumi.'),
    sentence('Lực hút Trái Đất giữ mọi vật.', 'Earth gravity holds everything in place.', 'Gravitasi Bumi menahan segala sesuatu.'),
    sentence('Bầu khí quyển bảo vệ chúng ta.', 'The atmosphere protects us.', 'Atmosfer melindungi kita.'),
    sentence('Tàu vũ trụ bay vút vào không gian.', 'The rocket shoots into space.', 'Pesawat luar angkasa melesat ke luar angkasa.'),
    sentence('Kính viễn vọng giúp quan sát thiên hà .', 'The telescope helps observe galaxies.', 'Teleskop membantu mengamati galaksi.'),
    sentence('Con người luôn muốn khám phá vũ trụ.', 'Humans always want to explore space.', 'Manusia selalu ingin menjelajahi luar angkasa.'),
    sentence('Vũ trụ bao la có nhiều bí ẩn.', 'The vast universe holds many mysteries.', 'Alam semesta yang luas menyimpan banyak misteri.'),
    sentence('Con người đã đặt chân lên Mặt Trăng.', 'Humans have set foot on the Moon.', 'Manusia telah menginjakkan kaki di Bulan.'),
    sentence('Robot tự hành lấy đất trên Sao Hỏa.', 'The rover collects soil on Mars.', 'Rover mengumpulkan tanah di Mars.'),
    sentence('Phi hành gia học cách sống lơ lửng.', 'Astronauts learn how to live in zero gravity.', 'Astronaut belajar cara hidup melayang.'),
    sentence('Nhà du hành sống trên trạm không gian.', 'Cosmonauts live aboard the space station.', 'Antarikawan tinggal di stasiun luar angkasa.'),
    sentence('Những vệt sao băng lướt qua bầu trời đêm.', 'Shooting stars streak across the night sky.', 'Bintang jatuh melintas di langit malam.'),
    sentence('Dải ngân hà lấp lánh như dòng sông bạc.', 'The Milky Way sparkles like a silver river.', 'Bima Sakti berkilau seperti sungai perak.'),
    sentence('Màn đêm ôm trọn muôn ngàn vì tinh tú.', 'Night embraces thousands of stars.', 'Malam merengkuh ribuan bintang.'),
    sentence('Bé gửi ước mơ bay cùng những vì sao.', 'The child sends dreams soaring with the stars.', 'Anak itu menerbangkan mimpinya bersama bintang-bintang.'),
    sentence('Nhà khoa học tìm sự sống ngoài Trái Đất.', 'Scientists search for extraterrestrial life.', 'Para ilmuwan mencari kehidupan di luar Bumi.'),
    sentence('Bé mơ ước lớn lên làm phi hành gia.', 'The child dreams of becoming an astronaut when grown up.', 'Anak itu bermimpi menjadi astronaut saat dewasa.'),
    sentence('Học sinh rất thích môn khoa học vũ trụ.', 'Students really enjoy space science.', 'Para siswa sangat menyukai ilmu antariksa.'),
    sentence('Vầng trăng sáng vằng vặc giữa bầu trời đêm.', 'The full moon shines brightly in the night sky.', 'Bulan purnama bersinar terang benderang di langit malam.')
  ),
  'grade5-paid-01-sentence': sentencePack(
    sentence('Em \u0111\u1ecdc m\u1ed9t c\u00e2u ng\u1eafn.', 'I read a short sentence.', 'Saya membaca kalimat pendek.'),
    sentence('Ba m\u1eb9 c\u00f9ng h\u1ecdc v\u1edbi em.', 'My parents study with me.', 'Orang tua belajar bersama saya.'),
    sentence('Em vi\u1ebft c\u00e2u th\u1eadt r\u00f5.', 'I write a clear sentence.', 'Saya menulis kalimat yang jelas.'),
    sentence('M\u1ed7i t\u1eeb \u0111\u1ec1u c\u00f3 ngh\u0129a.', 'Every word has meaning.', 'Setiap kata punya arti.')
  ),
  'grade5-paid-02-descriptions': sentencePack(
    sentence('C\u00f4 b\u00e9 m\u1eb7c \u00e1o xanh.', 'The girl wears a blue shirt.', 'Anak perempuan memakai baju biru.'),
    sentence('Chi\u1ebfc b\u00e0n nh\u1ecf r\u1ea5t \u0111\u1eb9p.', 'The small table is nice.', 'Meja kecil itu bagus.'),
    sentence('B\u1ea1n em c\u00f3 t\u00f3c \u0111en.', 'My friend has black hair.', 'Teman saya berambut hitam.'),
    sentence('C\u00e1nh c\u1eeda cao v\u00e0 r\u1ed9ng.', 'The door is tall and wide.', 'Pintunya tinggi dan lebar.')
  ),
  'grade5-paid-03-health-dialogue': sentencePack(
    sentence('B\u00e1c s\u0129 h\u1ecfi em c\u00f3 \u0111au kh\u00f4ng.', 'The doctor asks if I hurt.', 'Dokter bertanya apakah saya sakit.'),
    sentence('Em ngh\u1ec9 ng\u01a1i v\u00e0 u\u1ed1ng n\u01b0\u1edbc.', 'I rest and drink water.', 'Saya beristirahat dan minum air.'),
    sentence('M\u1eb9 nh\u1eafc em gi\u1eef s\u1ee9c kh\u1ecfe.', 'Mother reminds me to stay healthy.', 'Ibu mengingatkan saya agar sehat.'),
    sentence('Em n\u00f3i m\u00ecnh \u0111\u00e3 kh\u1ecfe.', 'I say that I feel well.', 'Saya berkata bahwa saya sehat.')
  ),
  'grade5-paid-04-food-dialogue': sentencePack(
    sentence('Cho em m\u1ed9t b\u00e1t c\u01a1m.', 'Please give me a bowl of rice.', 'Tolong beri saya semangkuk nasi.'),
    sentence('Em mu\u1ed1n u\u1ed1ng n\u01b0\u1edbc cam.', 'I want to drink orange juice.', 'Saya ingin minum jus jeruk.'),
    sentence('M\u00f3n n\u00e0y c\u00f3 v\u1ecb ngon.', 'This dish tastes good.', 'Makanan ini rasanya enak.'),
    sentence('C\u1ea3 nh\u00e0 c\u00f9ng \u0103n t\u1ed1i.', 'The whole family eats dinner.', 'Seluruh keluarga makan malam.')
  ),
  'grade5-paid-05-time-plans': sentencePack(
    sentence('H\u00f4m nay l\u00e0 th\u1ee9 Hai.', 'Today is Monday.', 'Hari ini hari Senin.'),
    sentence('Em l\u1eadp k\u1ebf ho\u1ea1ch cho tu\u1ea7n.', 'I make a plan for the week.', 'Saya membuat rencana mingguan.'),
    sentence('Ng\u00e0y mai em d\u1eady s\u1edbm.', 'I will wake early tomorrow.', 'Besok saya akan bangun pagi.'),
    sentence('M\u1ed9t gi\u1edd n\u1eefa em \u0111i.', 'I leave in one hour.', 'Saya pergi satu jam lagi.')
  ),
  'grade5-paid-06-weather-trip': sentencePack(
    sentence('Tr\u1eddi m\u01b0a n\u00ean em m\u1eb7c \u00e1o m\u01b0a.', 'It rains, so I wear a raincoat.', 'Hujan, jadi saya memakai jas hujan.'),
    sentence('Gia \u0111\u00ecnh \u0111i t\u00e0u \u0111\u1ebfn bi\u1ec3n.', 'The family takes a train to the sea.', 'Keluarga naik kereta ke laut.'),
    sentence('Em mang theo chi\u1ebfc m\u0169.', 'I bring a hat.', 'Saya membawa topi.'),
    sentence('Chuy\u1ebfn \u0111i an to\u00e0n v\u00e0 vui.', 'The trip is safe and fun.', 'Perjalanan aman dan menyenangkan.')
  ),
  'grade5-paid-07-community-jobs': sentencePack(
    sentence('Ch\u00fa c\u00f4ng an gi\u1eef g\u00ecn ph\u1ed1.', 'The police officer keeps the street safe.', 'Polisi menjaga jalan tetap aman.'),
    sentence('C\u00f4 gi\u00e1o l\u00e0m vi\u1ec7c \u1edf tr\u01b0\u1eddng.', 'The teacher works at school.', 'Guru bekerja di sekolah.'),
    sentence('B\u00e1c n\u00f4ng d\u00e2n tr\u1ed3ng l\u00faa.', 'The farmer grows rice.', 'Petani menanam padi.'),
    sentence('M\u1ecdi ng\u01b0\u1eddi gi\u00fap \u0111\u1ee1 nhau.', 'Everyone helps one another.', 'Semua orang saling membantu.')
  ),
  'grade5-paid-08-hobbies-sports': sentencePack(
    sentence('Em th\u00edch \u0111\u00e1 b\u00f3ng sau gi\u1edd h\u1ecdc.', 'I like football after class.', 'Saya suka sepak bola setelah kelas.'),
    sentence('B\u1ea1n em th\u00edch v\u1ebd tranh.', 'My friend likes drawing.', 'Teman saya suka menggambar.'),
    sentence('Ch\u00fang em ch\u01a1i trong \u0111\u1ed9i.', 'We play on a team.', 'Kami bermain dalam tim.'),
    sentence('Th\u1ec3 thao gi\u00fap c\u01a1 th\u1ec3 kh\u1ecfe.', 'Sports keep the body healthy.', 'Olahraga menjaga tubuh sehat.')
  ),
  'grade5-paid-09-home-tech': sentencePack(
    sentence('Nh\u00e0 th\u00f4ng minh c\u00f3 \u0111\u00e8n ti\u1ebft ki\u1ec7m.', 'A smart home has saving lights.', 'Rumah pintar punya lampu hemat.'),
    sentence('M\u00e1y t\u00ednh \u0111\u1eb7t tr\u00ean b\u00e0n.', 'The computer is on the table.', 'Komputer ada di atas meja.'),
    sentence('C\u1eeda s\u1ed5 \u0111\u00f3n \u00e1nh n\u1eafng.', 'The window lets in sunlight.', 'Jendela menerima cahaya matahari.'),
    sentence('Em gi\u1eef nh\u00e0 s\u1ea1ch \u0111\u1eb9p.', 'I keep the house clean.', 'Saya menjaga rumah tetap bersih.')
  ),
  'grade5-paid-10-safety-nature': sentencePack(
    sentence('Em \u0111\u1ed9i m\u0169 khi \u0111i xe.', 'I wear a helmet when riding.', 'Saya memakai helm saat berkendara.'),
    sentence('Ch\u00fang em ti\u1ebft ki\u1ec7m n\u01b0\u1edbc.', 'We save water.', 'Kami menghemat air.'),
    sentence('C\u00e2y xanh gi\u00fap kh\u00f4ng kh\u00ed s\u1ea1ch.', 'Green trees keep air clean.', 'Pohon hijau menjaga udara bersih.'),
    sentence('Kh\u00f4ng n\u00e9m r\u00e1c xu\u1ed1ng s\u00f4ng.', 'Do not throw waste in the river.', 'Jangan membuang sampah ke sungai.')
  ),
  'grade5-paid-11-festival-story': sentencePack(
    sentence('T\u1ebft \u0111\u1ebfn, c\u1ea3 nh\u00e0 c\u00f9ng d\u1ecdn.', 'Tet comes and the family cleans together.', 'Tet tiba dan keluarga bersih-bersih.'),
    sentence('Tr\u1ebb em m\u1eb7c \u00e1o m\u1edbi.', 'Children wear new clothes.', 'Anak-anak memakai baju baru.'),
    sentence('Ch\u00fang em xem h\u1ed9i vui.', 'We watch a fun festival.', 'Kami menonton festival yang meriah.'),
    sentence('M\u1ecdi ng\u01b0\u1eddi trao nhau l\u1eddi ch\u00fac.', 'Everyone exchanges good wishes.', 'Semua orang saling memberi ucapan.')
  ),
  'grade5-paid-12-master': sentencePack(
    sentence('Em d\u00f9ng t\u1eeb m\u1edbi \u0111\u1ec3 vi\u1ebft c\u00e2u.', 'I use new words to write sentences.', 'Saya memakai kata baru untuk menulis kalimat.'),
    sentence('Ch\u00fang em \u00f4n t\u1eadp m\u1ecdi ch\u1ee7 \u0111\u1ec1.', 'We review every topic.', 'Kami mengulang semua topik.'),
    sentence('G\u00f5 \u0111\u00fang gi\u00fap em h\u1ecdc t\u1ed1t.', 'Correct typing helps me learn.', 'Mengetik benar membantu saya belajar.'),
    sentence('Em s\u1eb5n s\u00e0ng v\u01b0\u1ee3t qua th\u1eed th\u00e1ch.', 'I am ready to pass the challenge.', 'Saya siap melewati tantangan.')
  ),
});

export function getGrade5VietnameseProgressionScript(lessonId) {
  return GRADE5_VI_PROGRESSION_SCRIPTS[lessonId] || null;
}

export function getGrade5VietnameseProgressionTranslation(text, translationLanguage = 'en') {
  const translation = GRADE5_VI_PROGRESSION_TRANSLATIONS[text] || Object.freeze({ en: text, id: text });
  return {
    translationText: translationLanguage === 'none' ? '' : translation[translationLanguage] || translation.en,
    meaningVi: text
  };
}

export function buildGrade5ProgressionSupplement(typingLanguage = 'vi', translationLanguage = 'en') {
  const typingCode = ['vi', 'en', 'id'].includes(typingLanguage) ? typingLanguage : 'vi';
  const meaningCode = ['vi', 'en', 'id', 'none'].includes(translationLanguage) ? translationLanguage : 'en';
  return [...GRADE5_PROGRESSION_ONE_CHAR_WORDS, ...GRADE5_PROGRESSION_EXTRA_WORDS].map((item, index) => ({
    id: `grade5-progression-char-${item.id}-${typingCode}`,
    conceptId: item.id,
    text: item.texts[typingCode],
    translationText: meaningCode === 'none' ? '' : item.texts[meaningCode],
    meaningVi: item.texts.vi,
    level: 'easy',
    topic: 'course-foundation',
    gradeBand: '1-5',
    language: typingCode === 'vi' ? 'vietnamese' : typingCode === 'id' ? 'indonesian' : 'english',
    originalIndex: index,
    source: 'grade5-progression-supplement'
  }));
}

export function getGrade5SentencePack(lessonId) {
  return GRADE5_SENTENCE_LIBRARY[lessonId] || Object.freeze([]);
}

export function getGrade5Topic(topicId) {
  return GRADE5_TOPICS.find((topic) => topic.id === topicId) || null;
}

export function getGrade5Concepts(topicIds = []) {
  const selected = new Set(Array.isArray(topicIds) ? topicIds : topicIds === 'all' ? GRADE5_TOPICS.map((topic) => topic.id) : [topicIds]);
  return GRADE5_VOCABULARY.filter((word) => selected.has(word.topic));
}

export function buildGrade5Words(typingLanguage = 'vi', translationLanguage = 'en', topicIds = 'all') {
  const typingCode = ['vi', 'en', 'id'].includes(typingLanguage) ? typingLanguage : 'vi';
  const meaningCode = ['vi', 'en', 'id', 'none'].includes(translationLanguage) ? translationLanguage : 'en';
  return getGrade5Concepts(topicIds).map((concept, index) => ({
    id: `grade5-word-${concept.id}-${typingCode}`,
    conceptId: concept.conceptId,
    text: concept.texts[typingCode],
    translationText: meaningCode === 'none' ? '' : concept.texts[meaningCode],
    meaningVi: concept.texts.vi,
    level: concept.level,
    topic: concept.topic,
    gradeBand: '1-5',
    language: typingCode === 'vi' ? 'vietnamese' : typingCode === 'id' ? 'indonesian' : 'english',
    originalIndex: index,
    source: 'grade5-core'
  }));
}
