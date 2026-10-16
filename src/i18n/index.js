import { GAME_CONFIG } from '../game/gameConfig.js';
import { ARCADE_MESSAGES } from './locales/arcade.js';
import { locale as VI_LOCALE } from './locales/vi.js';
import { locale as EN_LOCALE } from './locales/en.js';

// The interface currently ships in Vietnamese and English. Typing/meaning
// languages remain independent so existing vocabulary data is preserved.
const SUPPORTED_UI_LANGUAGES = Object.freeze([VI_LOCALE, EN_LOCALE]);

export const UI_MESSAGES = Object.freeze({
  vi: {
    appName: 'PHI ĐỘI NGÔN TỪ',
    pageTitle: 'Phi Đội Ngôn Từ · Việt - Anh - Indonesia',
    metaDescription: 'Game luyện gõ Việt, Anh và Indonesia với nghĩa hỗ trợ độc lập.',
    soundToggle: 'Bật hoặc tắt âm thanh', mainNavigation: 'Điều hướng menu chính', gameArea: 'Khu vực chơi', canvasLabel: 'Thiên thạch mang từ luyện gõ', typingInputLabel: 'Vùng nhập chữ cho trò chơi', virtualKeyboardLabel: 'Bàn phím ảo hướng dẫn ngón tay',
    instructions: 'Hướng dẫn', play: 'CHƠI NGAY', course: 'KHÓA HỌC', custom: 'TẠO MÀN CHƠI',
    settingsTitle: 'CÀI ĐẶT ĐA NGÔN NGỮ', interfaceLanguage: 'Ngôn ngữ giao diện', typingLanguage: 'Ngôn ngữ luyện gõ', translationLanguage: 'Ngôn ngữ giải nghĩa',
    start: 'BẮT ĐẦU NHIỆM VỤ', meaning: 'NGHĨA', target: 'MỤC TIÊU', currentInput: 'ĐANG GÕ', completed: 'HOÀN THÀNH', language: 'NGÔN NGỮ', source: 'NGUỒN TỪ',
    signup: 'ĐĂNG KÝ DÙNG THỬ', saveTrial: 'GỬI ĐĂNG KÝ', signupSavedLocal: 'Đã lưu thông tin trên thiết bị này. Chủ web chỉ nhận được khi cấu hình biểu mẫu online.',
    signupOpened: 'Biểu mẫu đăng ký đã được mở. Vui lòng hoàn tất bước gửi trên tab mới.', signupSent: 'Đăng ký đã được gửi thành công.', signupNeedsContact: 'Hãy nhập email hoặc Zalo / WhatsApp để có thể liên hệ.', signupOffline: 'Chưa kết nối biểu mẫu online; thông tin mới chỉ được lưu trên thiết bị này.',
    pause: 'Tạm dừng', restart: 'Chơi lại', restartGame: 'CHƠI LẠI VÁN NÀY', home: 'Trang chủ', homeUpper: 'VỀ TRANG CHỦ', create: 'Tạo màn', createUpper: 'TẠO MÀN CHƠI MỚI', fullscreen: 'Toàn màn hình', fullscreenToggle: 'Bật / thoát toàn màn hình', resume: 'TIẾP TỤC',
    score: 'Điểm', combo: 'Combo', shield: 'Lá chắn', accuracy: 'Độ chính xác', speed: 'Tốc độ', level: 'Màn', topic: 'Chủ đề', wordSource: 'Nguồn từ',
    systemInput: 'UniKey / EVKey / VNI hệ thống', builtinTelex: 'Telex tích hợp', accented: 'Có dấu', plain: 'Không dấu', diacriticMode: 'Chế độ dấu tiếng Việt',
    immediate: 'Hiện nghĩa ngay', after: 'Chỉ hiện sau khi hoàn thành', hidden: 'Ẩn nghĩa', noTranslation: 'Không hiển thị',
    slowest: 'Chậm nhất', verySlow: 'Rất chậm', slow: 'Chậm', medium: 'Vừa', fast: 'Nhanh', veryFast: 'Rất nhanh', dynamic: 'Tăng dần',
    speedSeconds: '{{label}} · {{seconds}} giây', meteorTime: '{{seconds}} giây để hoàn thành một thiên thạch.', customTopic: 'Tạo màn chơi',
    oneShotTitle: 'Mỗi ký tự đúng - một viên đạn', instructionStep1Title: 'Gõ để khóa', instructionStep1: 'Game ưu tiên thiên thạch gần vùng phòng thủ nhất khi nhiều mục tiêu có cùng chữ đầu.',
    instructionStep2Title: 'Mỗi ký tự đúng = 1 viên', oneShotStep2: 'Mỗi ký tự hoàn chỉnh và đúng tạo đúng một viên đạn; trạng thái Telex/IME tạm thời không bắn thừa.',
    instructionStep3Title: 'Viên cuối mới phá hủy', oneShotStep3: 'Các viên đạn trúng lần lượt từng ký tự. Chỉ viên của ký tự cuối cùng mới phá hủy thiên thạch.',
    telexExample: 'Ví dụ Telex:', telexResult: 'đỏ = 2 phát đúng ký tự',
    reportWord: 'BÁO TỪ / BẢN DỊCH SAI', reportSaved: 'Đã lưu và sao chép nội dung phản hồi. Bạn có thể dán vào biểu mẫu góp ý.',
    guideNote: 'Gõ tiếng Việt bằng EVKey/UniKey: chọn bộ gõ hệ thống. Dùng Telex tích hợp: tắt EVKey/UniKey để tránh nhập dấu hai lần. Khi gõ Anh hoặc Indonesia, hãy chuyển EVKey/UniKey sang chế độ tiếng Anh.',
    heroEyebrow: 'ORBIT TYPE · BẢN DÙNG THỬ ĐA NGÔN NGỮ · MÁY TÍNH', heroTitle: 'Gõ ngôn ngữ mới.', heroTitleAccent: 'Mỗi ký tự đúng - khai hỏa.',
    heroCopy: 'Chọn riêng ngôn ngữ giao diện, ngôn ngữ cần gõ và ngôn ngữ giải nghĩa. Bản dùng thử hỗ trợ Việt, Anh và Indonesia.', concepts: 'khái niệm', languages: 'ngôn ngữ', languageLayers: 'lớp ngôn ngữ',
    setupAria: 'Thiết lập trò chơi', setupLabel: 'THIẾT LẬP NHIỆM VỤ', choosePractice: 'Chọn cách luyện', bestScore: 'Kỷ lục: {{score}}', quickPresets: 'Cấu hình nhanh',
    presetViViEn: 'Việt học Việt · nghĩa Anh', presetEnViEn: 'English UI · học Việt', presetIdViId: 'Indonesia học Việt', presetViEnVi: 'Việt học Anh', presetIdEnId: 'Indonesia học Anh',
    modeVi: 'Tiếng Việt', modeViDesc: 'Luyện từ/cụm từ tiếng Việt bằng EVKey, UniKey, VNI hoặc Telex tích hợp.', modeEn: 'Tiếng Anh', modeEnDesc: 'Luyện từ/cụm từ tiếng Anh bằng bàn phím QWERTY.', modeId: 'Bahasa Indonesia', modeIdDesc: 'Luyện từ Indonesia bằng bàn phím QWERTY Latin.',
    keyboardLegend: '2. Bộ gõ tiếng Việt', keyboardHintSystem: 'Bật EVKey/UniKey/VNI. Game nhận kết quả đã hoàn chỉnh từ vùng nhập ẩn.', keyboardHintTelex: 'Tắt EVKey/UniKey rồi gõ Telex trực tiếp trong game.',
    bilingualLegend: '2. Hỗ trợ học song ngữ', caseSensitive: 'Phân biệt chữ hoa', caseHint: 'Mặc định tắt để phù hợp người mới học.', meaningDisplay: 'Hiển thị nghĩa phụ', translationSafe: 'Bản dịch chỉ để học, không tham gia kiểm tra đúng/sai và không nhận đạn.',
    sourceLegend: '3. Nguồn từ', defaultBank: 'Kho khái niệm · {{count}}', customList: 'Danh sách tùy chỉnh', createList: 'Tạo danh sách mới',
    sourceDefaultSummary: 'Đang dùng {{count}} khái niệm đa ngôn ngữ · {{language}}.', sourceCustomSummary: 'Đang dùng {{count}} mục từ danh sách “{{label}}”.', sourceCustomAvailable: 'Đang dùng kho mặc định · có danh sách {{language}} tùy chỉnh gồm {{count}} mục.',
    speedLabel: 'Tốc độ', syllableLevel: 'Cấp tiếng', wordLevel: 'Cấp từ', topicLabel: 'Chủ đề', autoLevel: 'Tự động tăng dần', easy: 'Dễ', hard: 'Khó', allTopics: 'Tất cả chủ đề',
    speedHelp: 'Khuyến nghị: Chrome hoặc Edge trên máy tính, độ phân giải từ 1366 × 768.', speedHelpSlowest: '50 giây cho mỗi thiên thạch; 1 mục tiêu mỗi lần.', speedHelpVerySlow: '40 giây cho mỗi thiên thạch; tối đa 2 mục tiêu cùng lúc.', speedHelpVeryFast: 'Rất nhanh: mục tiêu xuất hiện dồn và rơi nhanh hơn rõ rệt.',
    topicFamily: 'Gia đình', topicSchool: 'Trường học', topicObjects: 'Đồ vật', topicAnimals: 'Động vật', topicColors: 'Màu sắc', topicFood: 'Đồ ăn & thức uống', topicNature: 'Thiên nhiên', topicBody: 'Cơ thể', topicActions: 'Hành động', topicNumbers: 'Số đếm', topicTime: 'Thời gian', topicAdjectives: 'Tính từ', topicFeelings: 'Cảm xúc', topicPlaces: 'Địa điểm', topicClassroom: 'Lớp học', topicHome: 'Sinh hoạt hằng ngày', topicClothes: 'Quần áo', topicHealth: 'Sức khỏe', topicPets: 'Thú cưng', topicDrinks: 'Đồ uống', topicCalendar: 'Lịch và ngày', topicWeather: 'Thời tiết', topicTransport: 'Giao thông', topicCommunity: 'Cộng đồng', topicJobs: 'Nghề nghiệp', topicHobbies: 'Sở thích', topicSports: 'Thể thao', topicHouse: 'Nhà cửa', topicTechnology: 'Công nghệ', topicSafety: 'An toàn', topicEnvironment: 'Môi trường', topicFestivals: 'Lễ hội', topicTravel: 'Du lịch',
    trialName: 'Tên', trialEmail: 'Email', trialMessenger: 'Zalo / WhatsApp', trialCountry: 'Quốc gia', trialNative: 'Ngôn ngữ mẹ đẻ', trialLearning: 'Ngôn ngữ muốn học', trialPurpose: 'Mục đích', trialPayment: 'Mức sẵn sàng trả phí', trialFeedback: 'Góp ý về từ/câu/dịch nghĩa bị sai',
    purposePersonal: 'Cá nhân', purposeParent: 'Phụ huynh', purposeStudent: 'Học sinh', purposeTeacher: 'Giáo viên', purposeClass: 'Lớp học', purposeCenter: 'Trung tâm', purposeSchool: 'Trường học', purposeOther: 'Khác',
    paymentUnknown: 'Chưa xác định', paymentFree: 'Chỉ dùng miễn phí', paymentSmall: 'Có thể trả gói nhỏ', paymentFull: 'Sẵn sàng mua bản đầy đủ', paymentSchool: 'Quan tâm gói lớp/trường', trialConfigNote: 'Bản tĩnh cần cấu hình một biểu mẫu online trong config.js để chủ web nhận đăng ký.',
    customEyebrow: 'TỰ TẠO KHO TỪ · XỬ LÝ TRÊN THIẾT BỊ', customTitle: 'Tạo màn chơi từ nội dung của bạn', customIntro: 'Dán văn bản, đọc TXT/MD/CSV, lấy nội dung URL hoặc dùng OCR. Mỗi mục hợp lệ trở thành một mục tiêu riêng.', backToPlay: 'Quay lại Chơi ngay',
    chooseSource: 'Chọn nguồn nội dung', characters: '{{count}} ký tự', lessonLanguage: 'Ngôn ngữ bài học', pasteText: 'Dán văn bản', uploadTxt: 'Tải TXT', enterUrl: 'Nhập URL', imageOcr: 'Ảnh OCR', textContent: 'Nội dung văn bản', pastePlaceholder: 'Dán đoạn văn, bài học hoặc danh sách từ tại đây...', pasteLatinPlaceholder: 'Dán đoạn văn hoặc từng cặp như: school = trường học...', useSample: 'Dùng nội dung mẫu', clearContent: 'Xóa nội dung', analyzeNow: 'Phân tích ngay',
    dropTextFile: 'Thả hoặc chọn tệp văn bản', textFileSupport: 'TXT, MD, CSV · tối đa 2 MB · đọc hoàn toàn trên thiết bị', noFile: 'Chưa chọn tệp', removeFile: 'Xóa tệp', fileScope: 'Bản này tập trung vào tệp văn bản nhẹ; PDF và DOCX không được nhận.', webAddress: 'Địa chỉ trang web', fetchContent: 'Lấy nội dung', urlHint: 'Trình duyệt sẽ thử đọc trực tiếp. Trang chặn CORS cần được dán nội dung thủ công.',
    ocrFlow: 'Ảnh chụp → OCR → sửa văn bản → tạo bài học', ocrIntro: 'OCR chỉ được tải khi bạn mở chức năng này.', ocrLanguage: 'Ngôn ngữ OCR', ocrProvider: 'Bộ nhận dạng', ocrProviderLocal: 'OCR tại máy', ocrProviderGemini: 'Gemini API', ocrProviderOpenai: 'OpenAI API', ocrLocalHint: 'OCR tại máy giữ ảnh trên thiết bị; ảnh có cả Việt và Anh sẽ dùng mô hình kết hợp.', ocrApiConfigHint: 'API chưa sẵn sàng. Thêm cấu hình trong config/ocr.config.js hoặc chọn OCR tại máy.', ocrApiReadyHint: 'API đã sẵn sàng. Kết quả vẫn cần được kiểm tra trước khi tạo bài.', ocrAiPreparing: 'Đang chuẩn bị ảnh cho AI', ocrAiSending: 'Đang gửi ảnh đến AI', ocrAiComplete: 'AI đã đọc xong ảnh', dropImage: 'Kéo ảnh vào đây hoặc bấm để chọn', imageSupport: 'PNG, JPG, JPEG, WebP · tối đa 5 MB · chữ in rõ, một cột', sampleImages: 'Ảnh mẫu:', noImage: 'Chưa có ảnh', rotateLeft: 'Xoay trái', rotateRight: 'Xoay phải', grayscale: 'Chuyển ảnh xám', contrast: 'Tương phản', recognize: 'NHẬN DẠNG CHỮ', cancelOcr: 'Hủy OCR', chooseImage: 'Chọn ảnh để bắt đầu.', ocrReview: 'Văn bản OCR - hãy kiểm tra lại trước khi tạo bài', ocrPlaceholder: 'Kết quả nhận dạng xuất hiện tại đây. Bạn có thể sửa trước khi phân tích.', useOcrText: 'ĐƯA VĂN BẢN OCR VÀO BÀI HỌC', ocrScope: 'Không hỗ trợ chữ viết tay, PDF, camera hoặc ảnh nhiều cột phức tạp.', ocrNoText: 'Chưa có văn bản OCR để phân tích.', ocrSampleFailed: 'Không tải được ảnh mẫu.', ocrLoadingCore: 'Đang tải lõi OCR', ocrInitializing: 'Đang khởi tạo OCR', ocrLoadingVi: 'Đang tải mô hình tiếng Việt + English', ocrLoadingEn: 'Đang tải mô hình tiếng Anh', ocrLoadingId: 'Đang tải mô hình tiếng Indonesia', ocrPreparing: 'Đang chuẩn bị nhận dạng', ocrRecognizing: 'Đang nhận dạng chữ', ocrWorker: 'Đang tải bộ xử lý OCR', ocrProcessing: 'Đang xử lý', ocrChooseFirst: 'Hãy chọn một ảnh trước.', ocrComplete: 'OCR hoàn tất · độ tin cậy {{confidence}}%.', ocrCompleteAi: 'OCR {{provider}} hoàn tất.', ocrRecognizedVi: 'Đã nhận dạng ảnh. Hãy kiểm tra lại dấu tiếng Việt.', ocrRecognizedEn: 'Đã nhận dạng ảnh tiếng Anh. Hãy kiểm tra lại nội dung.', ocrRecognizedId: 'Đã nhận dạng ảnh tiếng Indonesia. Hãy kiểm tra lại nội dung.', ocrCancelled: 'Đã hủy OCR.',
    wordFilter: 'Bộ lọc từ', allowNumbers: 'Cho phép số', removeDuplicates: 'Loại từ trùng', shuffleOrder: 'Trộn thứ tự', latinOnly: 'Chỉ chữ Việt/Latin', length: 'Độ dài', all: 'Tất cả', customRange: 'Tùy chỉnh', minimum: 'Tối thiểu', maximum: 'Tối đa', previewEdit: 'Xem trước và chỉnh sửa', maxWords: 'Không giới hạn số từ', sourceCharacters: 'Ký tự nguồn', tokensFound: 'Từ tìm thấy', valid: 'Hợp lệ', rejected: 'Bị loại', duplicates: 'Trùng lặp', searchList: 'Tìm trong danh sách...', restore: 'Khôi phục', clearAll: 'Xóa hết', originalOrder: 'Thứ tự gốc', alphabetical: 'A-Z', byDifficulty: 'Theo độ khó', copy: 'Sao chép',
    sequenceTitle: 'Học theo trình tự bài gốc', sequenceKeep: 'Các từ lặp đang được giữ để bảo toàn trình tự bài học.', sequenceRemoved: 'Danh sách giữ thứ tự gốc nhưng từ lặp đang bị loại.', sequenceSwitch: 'Đổi về Thứ tự gốc để học đúng trình tự nội dung đã dán.', spawnInOrder: 'Sinh theo thứ tự', spawnInOrderDesc: 'Mục tiêu xuất hiện theo đúng thứ tự nhưng vẫn cho phép chọn mục tiêu đang thấy.', learnSequentially: 'Học lần lượt', learnSequentiallyDesc: 'Phải hoàn thành mục hiện tại trước khi chuyển sang mục tiếp theo.', splitSentences: 'Chia bài theo câu hoặc xuống dòng', addWord: 'Thêm một từ thủ công', add: 'Thêm', exportTxt: 'Xuất TXT', exportJson: 'Xuất JSON', importJson: 'Nhập JSON', deleteSaved: 'Xóa bản đã lưu', createGame: 'TẠO MÀN CHƠI', needTen: 'Cần ít nhất 10 từ hợp lệ. Hiện có {{count}}.', readyList: 'Sẵn sàng: {{count}} từ · {{mode}}.',
    originalSequential: 'Học lần lượt theo thứ tự gốc', originalSpawn: 'Sinh theo thứ tự gốc', shuffled: 'Trộn thứ tự', selectedOrder: 'Đã chọn {{order}}.', contentVi: 'Đã chọn nội dung tiếng Việt.', contentEn: 'Đã chọn nội dung tiếng Anh.', contentId: 'Đã chọn nội dung Bahasa Indonesia.', restoredOrder: 'Đã khôi phục đúng thứ tự nội dung gốc.', dedupeWarning: 'Loại từ trùng có thể làm thay đổi nhịp và ý nghĩa bài học.', dedupeDone: 'Đã giữ lần xuất hiện đầu; thứ tự còn lại không đổi.', deletedCustom: 'Đã xóa danh sách tùy chỉnh đã lưu.', copiedList: 'Đã sao chép danh sách từ.', copyBlocked: 'Trình duyệt không cho phép sao chép tự động.', emptyList: 'Danh sách đang trống.', loadedWords: 'Đã nạp {{count}} từ.', createdWords: 'Đã tạo bài học {{count}} từ.', readingFile: 'Đang đọc tệp...', readFile: 'Đã đọc {{name}}.', loadingContent: 'Đang tải nội dung...', loadedFrom: 'Đã lấy nội dung từ {{source}}.', otherWords: '+ {{count}} từ khác', editWord: 'Sửa {{word}}', removeWord: 'Xóa {{word}}',
    gameControls: 'Điều khiển ván chơi', sound: 'Âm thanh', learningWord: 'TỪ ĐANG HỌC', waitingTarget: 'Chưa khóa mục tiêu', chooseTargetMeaning: 'Chọn một mục tiêu để xem nghĩa.', meaningAfter: 'Nghĩa sẽ hiện sau khi hoàn thành từ.', defaultSource: 'MẶC ĐỊNH', courseLabel: 'KHÓA HỌC', lessonLabel: 'BÀI HỌC',
    pauseTitle: 'Đang tạm dừng', pauseDescription: 'Thiên thạch, đạn và thời gian đã dừng. Nhấn Escape để tiếp tục.', soundMixer: 'Bộ trộn hiệu ứng', masterVolume: 'Âm lượng tổng', gameEffects: 'Hiệu ứng game', testShot: 'Nghe thử phát bắn', testExplosion: 'Nghe thử vụ nổ',
    exitTitle: 'Bạn muốn dừng ván hiện tại?', exitDescription: 'Điểm của ván đang chơi sẽ không được ghi nhận. Danh sách tùy chỉnh gần nhất vẫn được giữ.', cancelContinue: 'HỦY - TIẾP TỤC CHƠI', stopHome: 'DỪNG VÀ VỀ TRANG CHỦ', stopCustom: 'DỪNG VÀ TẠO MÀN MỚI',
    missionEnded: 'Nhiệm vụ kết thúc', missionSubtitle: 'Bạn đã bảo vệ quỹ đạo rất tốt.', lessonCompleted: 'HOÀN THÀNH BÀI HỌC', lessonPassed: 'Bạn đã hoàn thành “{{title}}”.', lessonRetry: 'Bạn có thể luyện lại để tăng độ chính xác.', sequenceCompleted: 'Đã hoàn thành {{current}} / {{total}} từ theo đúng trình tự.', starsSummary: '{{stars}} sao · {{accuracy}}% chính xác', courseIncomplete: 'Bài chưa hoàn thành; tiến độ không thay đổi.', resultWords: 'Từ hoàn thành', maxCombo: 'Combo cao nhất', replay: 'HỌC LẠI / CHƠI LẠI', editLesson: 'CHỈNH SỬA BÀI HỌC', mainScreen: 'Về màn hình chính', shotCheckOk: 'Số phát bắn khớp số ký tự đã xác nhận.', shotCheckBad: 'Phát hiện chênh lệch giữa phát bắn và ký tự xác nhận.', fullscreenBlocked: 'Trình duyệt không cho phép toàn màn hình.', customSelected: 'Đã chọn danh sách tùy chỉnh {{count}} từ.', lessonGenerated: 'Đã sinh “{{title}}” · biến thể #{{variant}}.', presetApplied: 'Đã áp dụng cấu hình học nhanh.',
    engineStart: 'Màn 1 · Khởi động', engineLevel: 'Màn {{level}} · {{name}}', levelName1: 'Khởi động', levelName2: 'Tăng tốc', levelName3: 'Quỹ đạo dày', levelName4: 'Mưa sao băng', levelName5: 'Thủ lĩnh', wrongInput: 'Chưa đúng - dùng Backspace để sửa', bossWarning: 'CẢNH BÁO: Thiên thạch thủ lĩnh!', courseRetryTarget: 'Không sao - mục tiêu quay lại để bạn thử tiếp.', shieldDamage: 'Lá chắn -{{damage}}', engineLessonComplete: 'HOÀN THÀNH BÀI HỌC', noMeaning: 'Chưa có bản dịch',
    mobileWarning: 'Trò chơi được tối ưu cho máy tính có bàn phím.'
  },
  en: {
    appName: 'ORBIT TYPE', pageTitle: 'Orbit Type · Vietnamese - English - Indonesian', metaDescription: 'A Vietnamese, English and Indonesian typing game with an independent meaning language.',
    soundToggle: 'Toggle sound', mainNavigation: 'Main navigation', gameArea: 'Game area', canvasLabel: 'Typing targets and meteors', typingInputLabel: 'Typing input for the game', virtualKeyboardLabel: 'Finger guide keyboard',
    instructions: 'Guide', play: 'PLAY NOW', course: 'COURSE', custom: 'CUSTOM LESSON', settingsTitle: 'MULTILINGUAL SETTINGS', interfaceLanguage: 'Interface language', typingLanguage: 'Typing language', translationLanguage: 'Meaning language',
    start: 'START MISSION', meaning: 'MEANING', target: 'TARGET', currentInput: 'TYPING', completed: 'COMPLETED', language: 'LANGUAGE', source: 'WORD SOURCE', signup: 'JOIN THE TRIAL', saveTrial: 'SEND SIGNUP', signupSavedLocal: 'Saved on this device. The site owner receives it only after an online form is configured.', signupOpened: 'The signup form opened in a new tab. Please finish submitting it there.', signupSent: 'Your signup was sent successfully.', signupNeedsContact: 'Enter an email or Zalo / WhatsApp contact.', signupOffline: 'No online form is connected; this information is stored only on this device.',
    pause: 'Pause', restart: 'Restart', restartGame: 'RESTART THIS GAME', home: 'Home', homeUpper: 'GO HOME', create: 'Custom', createUpper: 'CREATE A NEW LESSON', fullscreen: 'Fullscreen', fullscreenToggle: 'Enter / exit fullscreen', resume: 'RESUME', score: 'Score', combo: 'Combo', shield: 'Shield', accuracy: 'Accuracy', speed: 'Speed', level: 'Level', topic: 'Topic', wordSource: 'Word source',
    systemInput: 'System IME / EVKey / UniKey', builtinTelex: 'Built-in Telex', accented: 'With diacritics', plain: 'Without diacritics', diacriticMode: 'Vietnamese diacritics', immediate: 'Show meaning now', after: 'Show after completion', hidden: 'Hide meaning', noTranslation: 'No meaning', slowest: 'Slowest', verySlow: 'Very slow', slow: 'Slow', medium: 'Medium', fast: 'Fast', veryFast: 'Very fast', dynamic: 'Progressive',
    speedSeconds: '{{label}} · {{seconds}} seconds', meteorTime: '{{seconds}} seconds to complete one meteor.', customTopic: 'Custom lesson',
    oneShotTitle: 'One correct character - one shot', instructionStep1Title: 'Type to lock on', instructionStep1: 'When targets share a first letter, the game prioritizes the one closest to the defense line.', instructionStep2Title: 'One confirmed character = one shot', oneShotStep2: 'Each fully confirmed character fires exactly one projectile; provisional IME/Telex states do not create duplicate shots.', instructionStep3Title: 'The final shot destroys', oneShotStep3: 'Projectiles hit characters in order. Only the projectile for the final character destroys the meteor.', telexExample: 'Telex example:', telexResult: 'đỏ = 2 confirmed character shots', reportWord: 'REPORT WRONG WORD / TRANSLATION', reportSaved: 'Feedback was saved and copied. Paste it into the feedback form.', guideNote: 'For Vietnamese with EVKey/UniKey, choose system input. For built-in Telex, disable EVKey/UniKey. Switch EVKey/UniKey to English mode when typing English or Indonesian.',
    heroEyebrow: 'ORBIT TYPE · MULTILINGUAL TRIAL · DESKTOP', heroTitle: 'Type a new language.', heroTitleAccent: 'Every correct character fires.', heroCopy: 'Choose the interface, typing and meaning languages independently. The trial supports Vietnamese, English and Indonesian.', concepts: 'concepts', languages: 'languages', languageLayers: 'language layers', setupAria: 'Game setup', setupLabel: 'MISSION SETUP', choosePractice: 'Choose your practice', bestScore: 'Best: {{score}}', quickPresets: 'Quick presets', presetViViEn: 'Vietnamese · English meaning', presetEnViEn: 'English UI · learn Vietnamese', presetIdViId: 'Indonesian learns Vietnamese', presetViEnVi: 'Vietnamese learns English', presetIdEnId: 'Indonesian learns English',
    modeVi: 'Vietnamese', modeViDesc: 'Practice Vietnamese words and phrases with EVKey, UniKey, VNI or built-in Telex.', modeEn: 'English', modeEnDesc: 'Practice English words and phrases on a QWERTY keyboard.', modeId: 'Bahasa Indonesia', modeIdDesc: 'Practice Indonesian words using a Latin QWERTY keyboard.', keyboardLegend: '2. Vietnamese input', keyboardHintSystem: 'Enable EVKey/UniKey/VNI. The game reads the committed result from a hidden input.', keyboardHintTelex: 'Disable EVKey/UniKey, then type Telex directly in the game.', bilingualLegend: '2. Bilingual learning support', caseSensitive: 'Case sensitive', caseHint: 'Off by default for new learners.', meaningDisplay: 'Meaning display', translationSafe: 'Meanings are learning aids only. They never count as answers or receive shots.',
    sourceLegend: '3. Word source', defaultBank: 'Concept bank · {{count}}', customList: 'Custom list', createList: 'Create a new list', sourceDefaultSummary: 'Using {{count}} multilingual concepts · {{language}}.', sourceCustomSummary: 'Using {{count}} entries from “{{label}}”.', sourceCustomAvailable: 'Using the default bank · a {{language}} custom list with {{count}} entries is available.', speedLabel: 'Speed', syllableLevel: 'Syllable level', wordLevel: 'Word level', topicLabel: 'Topic', autoLevel: 'Increase automatically', easy: 'Easy', hard: 'Hard', allTopics: 'All topics', speedHelp: 'Recommended: desktop Chrome or Edge at 1366 × 768 or above.', speedHelpSlowest: '50 seconds per meteor; one target at a time.', speedHelpVerySlow: '40 seconds per meteor; at most 2 targets are visible.', speedHelpVeryFast: 'Very fast: targets spawn in dense waves and fall much faster.',
    topicFamily: 'Family', topicSchool: 'School', topicObjects: 'Objects', topicAnimals: 'Animals', topicColors: 'Colors', topicFood: 'Food & drink', topicNature: 'Nature', topicBody: 'Body', topicActions: 'Actions', topicNumbers: 'Numbers', topicTime: 'Time', topicAdjectives: 'Adjectives', topicFeelings: 'Feelings', topicPlaces: 'Places', topicClassroom: 'Classroom', topicHome: 'Daily home life', topicClothes: 'Clothes', topicHealth: 'Health', topicPets: 'Pets', topicDrinks: 'Drinks', topicCalendar: 'Calendar and dates', topicWeather: 'Weather', topicTransport: 'Transport', topicCommunity: 'Community', topicJobs: 'Jobs', topicHobbies: 'Hobbies', topicSports: 'Sports', topicHouse: 'House and furniture', topicTechnology: 'Technology', topicSafety: 'Safety', topicEnvironment: 'Environment', topicFestivals: 'Festivals', topicTravel: 'Travel',
    trialName: 'Name', trialEmail: 'Email', trialMessenger: 'Zalo / WhatsApp', trialCountry: 'Country', trialNative: 'Native language', trialLearning: 'Language to learn', trialPurpose: 'Purpose', trialPayment: 'Willingness to pay', trialFeedback: 'Report a wrong word, phrase or translation', purposePersonal: 'Personal', purposeParent: 'Parent', purposeStudent: 'Student', purposeTeacher: 'Teacher', purposeClass: 'Class', purposeCenter: 'Learning center', purposeSchool: 'School', purposeOther: 'Other', paymentUnknown: 'Not sure yet', paymentFree: 'Free only', paymentSmall: 'May buy a small plan', paymentFull: 'Ready for the full version', paymentSchool: 'Interested in a class/school plan', trialConfigNote: 'Configure an online form in config.js so the site owner can receive signups.',
    customEyebrow: 'BUILD A WORD BANK · PROCESSED ON THIS DEVICE', customTitle: 'Create a game from your own content', customIntro: 'Paste text, read TXT/MD/CSV, load a URL or use OCR. Every valid entry becomes a separate target.', backToPlay: 'Back to Play now', chooseSource: 'Choose a content source', characters: '{{count}} characters', lessonLanguage: 'Lesson language', pasteText: 'Paste text', uploadTxt: 'Upload TXT', enterUrl: 'Enter URL', imageOcr: 'Image OCR', textContent: 'Text content', pastePlaceholder: 'Paste a passage, lesson or word list here...', pasteLatinPlaceholder: 'Paste a passage or pairs such as: school = trường học...', useSample: 'Use sample', clearContent: 'Clear content', analyzeNow: 'Analyze now', dropTextFile: 'Drop or choose a text file', textFileSupport: 'TXT, MD, CSV · up to 2 MB · read entirely on this device', noFile: 'No file selected', removeFile: 'Remove file', fileScope: 'This lightweight version accepts text files only; PDF and DOCX are not supported.', webAddress: 'Web page address', fetchContent: 'Fetch content', urlHint: 'The browser will try to read it directly. For sites that block CORS, paste the content instead.',
    ocrFlow: 'Image → OCR → edit text → create lesson', ocrIntro: 'OCR downloads only when you open this feature.', ocrLanguage: 'OCR language', ocrProvider: 'Recognition engine', ocrProviderLocal: 'Local OCR', ocrProviderGemini: 'Gemini API', ocrProviderOpenai: 'OpenAI API', ocrLocalHint: 'Local OCR keeps the image on this device and uses a mixed Vietnamese + English model.', ocrApiConfigHint: 'The API is not ready. Add its config in config/ocr.config.js or choose Local OCR.', ocrApiReadyHint: 'The API is ready. Review the result before creating the lesson.', ocrAiPreparing: 'Preparing the image for AI', ocrAiSending: 'Sending the image to AI', ocrAiComplete: 'AI finished reading the image', dropImage: 'Drop an image here or click to choose', imageSupport: 'PNG, JPG, JPEG, WebP · up to 5 MB · clear single-column print', sampleImages: 'Samples:', noImage: 'No image', rotateLeft: 'Rotate left', rotateRight: 'Rotate right', grayscale: 'Grayscale', contrast: 'Contrast', recognize: 'RECOGNIZE TEXT', cancelOcr: 'Cancel OCR', chooseImage: 'Choose an image to begin.', ocrReview: 'OCR text - review it before creating the lesson', ocrPlaceholder: 'Recognized text appears here. You can edit it before analysis.', useOcrText: 'USE OCR TEXT IN THE LESSON', ocrScope: 'Handwriting, PDF, camera capture and complex multi-column images are not supported.', ocrNoText: 'There is no OCR text to analyze.', ocrSampleFailed: 'Could not load the sample image.', ocrLoadingCore: 'Loading OCR core', ocrInitializing: 'Initializing OCR', ocrLoadingVi: 'Loading Vietnamese + English models', ocrLoadingEn: 'Loading English model', ocrLoadingId: 'Loading Indonesian model', ocrPreparing: 'Preparing recognition', ocrRecognizing: 'Recognizing text', ocrWorker: 'Loading OCR worker', ocrProcessing: 'Processing', ocrChooseFirst: 'Choose an image first.', ocrComplete: 'OCR complete · {{confidence}}% confidence.', ocrCompleteAi: '{{provider}} OCR complete.', ocrRecognizedVi: 'Vietnamese image recognized. Review all diacritics.', ocrRecognizedEn: 'English image recognized. Review the result.', ocrRecognizedId: 'Indonesian image recognized. Review the result.', ocrCancelled: 'OCR cancelled.',
    wordFilter: 'Word filter', allowNumbers: 'Allow numbers', removeDuplicates: 'Remove duplicates', shuffleOrder: 'Shuffle order', latinOnly: 'Vietnamese/Latin letters only', length: 'Length', all: 'All', customRange: 'Custom', minimum: 'Minimum', maximum: 'Maximum', previewEdit: 'Preview and edit', maxWords: 'Up to 2,000 entries', sourceCharacters: 'Source characters', tokensFound: 'Words found', valid: 'Valid', rejected: 'Rejected', duplicates: 'Duplicates', searchList: 'Search this list...', restore: 'Restore', clearAll: 'Clear all', originalOrder: 'Original order', alphabetical: 'A-Z', byDifficulty: 'By difficulty', copy: 'Copy', sequenceTitle: 'Learn in the source order', sequenceKeep: 'Repeated words are kept to preserve the lesson sequence.', sequenceRemoved: 'Original order is kept, but duplicate words are removed.', sequenceSwitch: 'Switch to Original order to follow the pasted content.', spawnInOrder: 'Spawn in order', spawnInOrderDesc: 'Targets appear in order, but you may select any visible target.', learnSequentially: 'Learn sequentially', learnSequentiallyDesc: 'Complete the current entry before the next one starts.', splitSentences: 'Split by sentence or line break', addWord: 'Add one word manually', add: 'Add', exportTxt: 'Export TXT', exportJson: 'Export JSON', importJson: 'Import JSON', deleteSaved: 'Delete saved list', createGame: 'CREATE GAME', needTen: 'At least 10 valid words are required. Current: {{count}}.', readyList: 'Ready: {{count}} words · {{mode}}.',
    originalSequential: 'Sequential source order', originalSpawn: 'Source spawn order', shuffled: 'Shuffled', selectedOrder: '{{order}} selected.', contentVi: 'Vietnamese content selected.', contentEn: 'English content selected.', contentId: 'Bahasa Indonesia content selected.', restoredOrder: 'The original content order was restored.', dedupeWarning: 'Removing duplicates can change a lesson’s rhythm and meaning.', dedupeDone: 'First occurrences were kept without changing the remaining order.', deletedCustom: 'The saved custom list was deleted.', copiedList: 'Word list copied.', copyBlocked: 'The browser blocked automatic copying.', emptyList: 'The list is empty.', loadedWords: 'Loaded {{count}} words.', createdWords: 'Created a {{count}}-word lesson.', readingFile: 'Reading file...', readFile: 'Read {{name}}.', loadingContent: 'Loading content...', loadedFrom: 'Loaded content from {{source}}.', otherWords: '+ {{count}} more words', editWord: 'Edit {{word}}', removeWord: 'Remove {{word}}',
    gameControls: 'Game controls', sound: 'Sound', learningWord: 'WORD IN FOCUS', waitingTarget: 'No target locked', chooseTargetMeaning: 'Lock a target to see its meaning.', meaningAfter: 'The meaning appears after you complete the word.', defaultSource: 'DEFAULT', courseLabel: 'COURSE', lessonLabel: 'LESSON', pauseTitle: 'Game paused', pauseDescription: 'Meteors, projectiles and time are paused. Press Escape to resume.', soundMixer: 'Effects mixer', masterVolume: 'Master volume', gameEffects: 'Game effects', testShot: 'Preview shot', testExplosion: 'Preview explosion', exitTitle: 'Stop the current game?', exitDescription: 'The current score will not be recorded. Your latest custom list remains saved.', cancelContinue: 'CANCEL - KEEP PLAYING', stopHome: 'STOP AND GO HOME', stopCustom: 'STOP AND CREATE A LESSON', missionEnded: 'Mission complete', missionSubtitle: 'You defended the orbit well.', lessonCompleted: 'LESSON COMPLETE', lessonPassed: 'You completed “{{title}}”.', lessonRetry: 'Practice again to improve your accuracy.', sequenceCompleted: 'Completed {{current}} / {{total}} words in sequence.', starsSummary: '{{stars}} stars · {{accuracy}}% accuracy', courseIncomplete: 'Lesson incomplete; progress was not changed.', resultWords: 'Words completed', maxCombo: 'Best combo', replay: 'PRACTICE / PLAY AGAIN', editLesson: 'EDIT LESSON', mainScreen: 'Back to main screen', shotCheckOk: 'Projectile count matches confirmed characters.', shotCheckBad: 'Projectile and confirmed-character counts differ.', fullscreenBlocked: 'The browser did not allow fullscreen.', customSelected: 'Selected a {{count}}-word custom list.', lessonGenerated: 'Generated “{{title}}” · variant #{{variant}}.', presetApplied: 'Quick learning preset applied.',
    engineStart: 'Level 1 · Warm-up', engineLevel: 'Level {{level}} · {{name}}', levelName1: 'Warm-up', levelName2: 'Accelerate', levelName3: 'Crowded orbit', levelName4: 'Meteor shower', levelName5: 'Commander', wrongInput: 'Not quite - use Backspace to correct it', bossWarning: 'WARNING: Commander meteor!', courseRetryTarget: 'That is okay - the target will return for another try.', shieldDamage: 'Shield -{{damage}}', engineLessonComplete: 'LESSON COMPLETE', noMeaning: 'No translation available', mobileWarning: 'This game is optimized for computers with a physical keyboard.'
  },
  id: {
    appName: 'ORBIT TYPE', pageTitle: 'Orbit Type · Vietnam - Inggris - Indonesia', metaDescription: 'Game mengetik bahasa Vietnam, Inggris, dan Indonesia dengan bahasa arti yang terpisah.',
    soundToggle: 'Aktifkan atau matikan suara', mainNavigation: 'Navigasi utama', gameArea: 'Area permainan', canvasLabel: 'Meteor dan target ketik', typingInputLabel: 'Kolom input untuk permainan', virtualKeyboardLabel: 'Papan ketik panduan jari',
    instructions: 'Panduan', play: 'MAIN SEKARANG', course: 'KURSUS', custom: 'LATIHAN KUSTOM', settingsTitle: 'PENGATURAN MULTIBAHASA', interfaceLanguage: 'Bahasa antarmuka', typingLanguage: 'Bahasa yang diketik', translationLanguage: 'Bahasa arti', start: 'MULAI MISI', meaning: 'ARTI', target: 'TARGET', currentInput: 'SEDANG DIKETIK', completed: 'SELESAI', language: 'BAHASA', source: 'SUMBER KATA', signup: 'DAFTAR UJI COBA', saveTrial: 'KIRIM PENDAFTARAN', signupSavedLocal: 'Data disimpan di perangkat ini. Pemilik situs hanya menerimanya setelah formulir online dikonfigurasi.', signupOpened: 'Formulir pendaftaran dibuka di tab baru. Silakan selesaikan pengiriman di sana.', signupSent: 'Pendaftaran berhasil dikirim.', signupNeedsContact: 'Masukkan email atau kontak Zalo / WhatsApp.', signupOffline: 'Formulir online belum terhubung; data hanya tersimpan di perangkat ini.',
    pause: 'Jeda', restart: 'Ulangi', restartGame: 'ULANGI PERMAINAN INI', home: 'Beranda', homeUpper: 'KE BERANDA', create: 'Latihan', createUpper: 'BUAT LATIHAN BARU', fullscreen: 'Layar penuh', fullscreenToggle: 'Masuk / keluar layar penuh', resume: 'LANJUTKAN', score: 'Skor', combo: 'Combo', shield: 'Perisai', accuracy: 'Akurasi', speed: 'Kecepatan', level: 'Level', topic: 'Topik', wordSource: 'Sumber kata', systemInput: 'IME sistem / EVKey / UniKey', builtinTelex: 'Telex bawaan', accented: 'Dengan diakritik', plain: 'Tanpa diakritik', diacriticMode: 'Diakritik bahasa Vietnam', immediate: 'Tampilkan arti langsung', after: 'Tampilkan setelah selesai', hidden: 'Sembunyikan arti', noTranslation: 'Tanpa arti', slowest: 'Paling lambat', verySlow: 'Sangat lambat', slow: 'Lambat', medium: 'Sedang', fast: 'Cepat', veryFast: 'Sangat cepat', dynamic: 'Meningkat',
    speedSeconds: '{{label}} · {{seconds}} detik', meteorTime: '{{seconds}} detik untuk menyelesaikan satu meteor.', customTopic: 'Latihan kustom',
    oneShotTitle: 'Satu karakter benar - satu tembakan', instructionStep1Title: 'Ketik untuk mengunci', instructionStep1: 'Jika beberapa target memiliki huruf awal yang sama, game memprioritaskan target terdekat dari garis pertahanan.', instructionStep2Title: 'Satu karakter pasti = satu tembakan', oneShotStep2: 'Setiap karakter yang sudah pasti dan benar menghasilkan tepat satu peluru; keadaan sementara IME/Telex tidak menambah tembakan.', instructionStep3Title: 'Tembakan akhir menghancurkan', oneShotStep3: 'Peluru mengenai karakter secara berurutan. Hanya peluru untuk karakter terakhir yang menghancurkan meteor.', telexExample: 'Contoh Telex:', telexResult: 'đỏ = 2 tembakan karakter', reportWord: 'LAPORKAN KATA / TERJEMAHAN SALAH', reportSaved: 'Masukan disimpan dan disalin. Tempelkan ke formulir masukan.', guideNote: 'Untuk mengetik bahasa Vietnam dengan EVKey/UniKey, pilih input sistem. Untuk Telex bawaan, matikan EVKey/UniKey. Saat mengetik bahasa Inggris atau Indonesia, ubah EVKey/UniKey ke mode Inggris.',
    heroEyebrow: 'ORBIT TYPE · UJI COBA MULTIBAHASA · DESKTOP', heroTitle: 'Ketik bahasa baru.', heroTitleAccent: 'Setiap karakter benar menembak.', heroCopy: 'Pilih bahasa antarmuka, bahasa ketik, dan bahasa arti secara terpisah. Uji coba mendukung bahasa Vietnam, Inggris, dan Indonesia.', concepts: 'konsep', languages: 'bahasa', languageLayers: 'lapisan bahasa', setupAria: 'Pengaturan game', setupLabel: 'PENGATURAN MISI', choosePractice: 'Pilih cara latihan', bestScore: 'Rekor: {{score}}', quickPresets: 'Preset cepat', presetViViEn: 'Vietnam · arti Inggris', presetEnViEn: 'Antarmuka Inggris · belajar Vietnam', presetIdViId: 'Indonesia belajar Vietnam', presetViEnVi: 'Vietnam belajar Inggris', presetIdEnId: 'Indonesia belajar Inggris',
    modeVi: 'Bahasa Vietnam', modeViDesc: 'Latih kata dan frasa Vietnam dengan EVKey, UniKey, VNI, atau Telex bawaan.', modeEn: 'Bahasa Inggris', modeEnDesc: 'Latih kata dan frasa Inggris dengan papan ketik QWERTY.', modeId: 'Bahasa Indonesia', modeIdDesc: 'Latih kata Indonesia dengan papan ketik QWERTY Latin.', keyboardLegend: '2. Input bahasa Vietnam', keyboardHintSystem: 'Aktifkan EVKey/UniKey/VNI. Game membaca hasil akhir dari kolom input tersembunyi.', keyboardHintTelex: 'Matikan EVKey/UniKey, lalu ketik Telex langsung di dalam game.', bilingualLegend: '2. Dukungan belajar dwibahasa', caseSensitive: 'Bedakan huruf besar', caseHint: 'Dinonaktifkan secara default untuk pemula.', meaningDisplay: 'Tampilan arti', translationSafe: 'Arti hanya membantu belajar. Arti tidak dihitung sebagai jawaban dan tidak terkena peluru.',
    sourceLegend: '3. Sumber kata', defaultBank: 'Bank konsep · {{count}}', customList: 'Daftar kustom', createList: 'Buat daftar baru', sourceDefaultSummary: 'Menggunakan {{count}} konsep multibahasa · {{language}}.', sourceCustomSummary: 'Menggunakan {{count}} entri dari “{{label}}”.', sourceCustomAvailable: 'Menggunakan bank default · tersedia daftar kustom {{language}} berisi {{count}} entri.', speedLabel: 'Kecepatan', syllableLevel: 'Tingkat suku kata', wordLevel: 'Tingkat kata', topicLabel: 'Topik', autoLevel: 'Naik otomatis', easy: 'Mudah', hard: 'Sulit', allTopics: 'Semua topik', speedHelp: 'Disarankan: Chrome atau Edge desktop, resolusi minimal 1366 × 768.', speedHelpSlowest: '50 detik per meteor; satu target setiap kali.', speedHelpVerySlow: '40 detik per meteor; maksimal 2 target terlihat.', speedHelpVeryFast: 'Sangat cepat: target muncul rapat dan jatuh jauh lebih cepat.',
    topicFamily: 'Keluarga', topicSchool: 'Sekolah', topicObjects: 'Benda', topicAnimals: 'Hewan', topicColors: 'Warna', topicFood: 'Makanan & minuman', topicNature: 'Alam', topicBody: 'Tubuh', topicActions: 'Aktivitas', topicNumbers: 'Angka', topicTime: 'Waktu', topicAdjectives: 'Kata sifat', topicFeelings: 'Perasaan', topicPlaces: 'Tempat', topicClassroom: 'Ruang kelas', topicHome: 'Kehidupan di rumah', topicClothes: 'Pakaian', topicHealth: 'Kesehatan', topicPets: 'Hewan peliharaan', topicDrinks: 'Minuman', topicCalendar: 'Kalender dan tanggal', topicWeather: 'Cuaca', topicTransport: 'Transportasi', topicCommunity: 'Komunitas', topicJobs: 'Pekerjaan', topicHobbies: 'Hobi', topicSports: 'Olahraga', topicHouse: 'Rumah dan perabot', topicTechnology: 'Teknologi', topicSafety: 'Keselamatan', topicEnvironment: 'Lingkungan', topicFestivals: 'Perayaan', topicTravel: 'Perjalanan',
    trialName: 'Nama', trialEmail: 'Email', trialMessenger: 'Zalo / WhatsApp', trialCountry: 'Negara', trialNative: 'Bahasa ibu', trialLearning: 'Bahasa yang ingin dipelajari', trialPurpose: 'Tujuan', trialPayment: 'Kesediaan membayar', trialFeedback: 'Laporkan kata, frasa, atau terjemahan yang salah', purposePersonal: 'Pribadi', purposeParent: 'Orang tua', purposeStudent: 'Siswa', purposeTeacher: 'Guru', purposeClass: 'Kelas', purposeCenter: 'Pusat belajar', purposeSchool: 'Sekolah', purposeOther: 'Lainnya', paymentUnknown: 'Belum tahu', paymentFree: 'Hanya versi gratis', paymentSmall: 'Mungkin membeli paket kecil', paymentFull: 'Siap membeli versi lengkap', paymentSchool: 'Tertarik paket kelas/sekolah', trialConfigNote: 'Konfigurasikan formulir online di config.js agar pemilik situs dapat menerima pendaftaran.',
    customEyebrow: 'BUAT BANK KATA · DIPROSES DI PERANGKAT INI', customTitle: 'Buat game dari konten Anda', customIntro: 'Tempel teks, baca TXT/MD/CSV, ambil URL, atau gunakan OCR. Setiap entri valid menjadi target terpisah.', backToPlay: 'Kembali ke Main sekarang', chooseSource: 'Pilih sumber konten', characters: '{{count}} karakter', lessonLanguage: 'Bahasa pelajaran', pasteText: 'Tempel teks', uploadTxt: 'Unggah TXT', enterUrl: 'Masukkan URL', imageOcr: 'OCR gambar', textContent: 'Isi teks', pastePlaceholder: 'Tempel paragraf, pelajaran, atau daftar kata di sini...', pasteLatinPlaceholder: 'Tempel paragraf atau pasangan seperti: school = sekolah...', useSample: 'Gunakan contoh', clearContent: 'Hapus isi', analyzeNow: 'Analisis sekarang', dropTextFile: 'Jatuhkan atau pilih file teks', textFileSupport: 'TXT, MD, CSV · maksimal 2 MB · dibaca sepenuhnya di perangkat', noFile: 'Belum ada file', removeFile: 'Hapus file', fileScope: 'Versi ringan ini hanya menerima file teks; PDF dan DOCX tidak didukung.', webAddress: 'Alamat halaman web', fetchContent: 'Ambil konten', urlHint: 'Browser akan mencoba membacanya langsung. Jika situs memblokir CORS, tempel kontennya.',
    ocrFlow: 'Gambar → OCR → edit teks → buat pelajaran', ocrIntro: 'OCR hanya diunduh saat fitur ini dibuka.', ocrLanguage: 'Bahasa OCR', ocrProvider: 'Mesin pengenalan', ocrProviderLocal: 'OCR lokal', ocrProviderGemini: 'Gemini API', ocrProviderOpenai: 'OpenAI API', ocrLocalHint: 'OCR lokal menyimpan gambar di perangkat ini dan memakai model gabungan Vietnam + Inggris.', ocrApiConfigHint: 'API belum siap. Tambahkan konfigurasi di config/ocr.config.js atau pilih OCR lokal.', ocrApiReadyHint: 'API siap digunakan. Periksa hasil sebelum membuat pelajaran.', ocrAiPreparing: 'Menyiapkan gambar untuk AI', ocrAiSending: 'Mengirim gambar ke AI', ocrAiComplete: 'AI selesai membaca gambar', dropImage: 'Jatuhkan gambar atau klik untuk memilih', imageSupport: 'PNG, JPG, JPEG, WebP · maksimal 5 MB · teks cetak satu kolom', sampleImages: 'Contoh:', noImage: 'Belum ada gambar', rotateLeft: 'Putar kiri', rotateRight: 'Putar kanan', grayscale: 'Skala abu-abu', contrast: 'Kontras', recognize: 'KENALI TEKS', cancelOcr: 'Batalkan OCR', chooseImage: 'Pilih gambar untuk mulai.', ocrReview: 'Teks OCR - periksa sebelum membuat pelajaran', ocrPlaceholder: 'Hasil pengenalan muncul di sini. Anda dapat mengeditnya sebelum dianalisis.', useOcrText: 'GUNAKAN TEKS OCR DALAM PELAJARAN', ocrScope: 'Tulisan tangan, PDF, kamera, dan gambar multikolom kompleks tidak didukung.', ocrNoText: 'Belum ada teks OCR untuk dianalisis.', ocrSampleFailed: 'Gambar contoh tidak dapat dimuat.', ocrLoadingCore: 'Memuat inti OCR', ocrInitializing: 'Menyiapkan OCR', ocrLoadingVi: 'Memuat model bahasa Vietnam + Inggris', ocrLoadingEn: 'Memuat model bahasa Inggris', ocrLoadingId: 'Memuat model bahasa Indonesia', ocrPreparing: 'Menyiapkan pengenalan', ocrRecognizing: 'Mengenali teks', ocrWorker: 'Memuat pemroses OCR', ocrProcessing: 'Memproses', ocrChooseFirst: 'Pilih gambar terlebih dahulu.', ocrComplete: 'OCR selesai · keyakinan {{confidence}}%.', ocrCompleteAi: 'OCR {{provider}} selesai.', ocrRecognizedVi: 'Gambar bahasa Vietnam dikenali. Periksa kembali semua diakritik.', ocrRecognizedEn: 'Gambar bahasa Inggris dikenali. Periksa hasilnya.', ocrRecognizedId: 'Gambar bahasa Indonesia dikenali. Periksa hasilnya.', ocrCancelled: 'OCR dibatalkan.',
    wordFilter: 'Filter kata', allowNumbers: 'Izinkan angka', removeDuplicates: 'Hapus duplikat', shuffleOrder: 'Acak urutan', latinOnly: 'Hanya huruf Vietnam/Latin', length: 'Panjang', all: 'Semua', customRange: 'Kustom', minimum: 'Minimum', maximum: 'Maksimum', previewEdit: 'Pratinjau dan edit', maxWords: 'Maksimal 2.000 entri', sourceCharacters: 'Karakter sumber', tokensFound: 'Kata ditemukan', valid: 'Valid', rejected: 'Ditolak', duplicates: 'Duplikat', searchList: 'Cari dalam daftar...', restore: 'Pulihkan', clearAll: 'Hapus semua', originalOrder: 'Urutan asli', alphabetical: 'A-Z', byDifficulty: 'Menurut kesulitan', copy: 'Salin', sequenceTitle: 'Belajar sesuai urutan sumber', sequenceKeep: 'Kata berulang dipertahankan untuk menjaga urutan pelajaran.', sequenceRemoved: 'Urutan asli dipertahankan, tetapi kata duplikat dihapus.', sequenceSwitch: 'Pilih Urutan asli untuk mengikuti konten yang ditempel.', spawnInOrder: 'Muncul berurutan', spawnInOrderDesc: 'Target muncul sesuai urutan, tetapi target yang terlihat tetap dapat dipilih.', learnSequentially: 'Belajar berurutan', learnSequentiallyDesc: 'Selesaikan entri saat ini sebelum melanjutkan.', splitSentences: 'Pisahkan menurut kalimat atau baris', addWord: 'Tambahkan satu kata', add: 'Tambah', exportTxt: 'Ekspor TXT', exportJson: 'Ekspor JSON', importJson: 'Impor JSON', deleteSaved: 'Hapus daftar tersimpan', createGame: 'BUAT GAME', needTen: 'Diperlukan minimal 10 kata valid. Saat ini: {{count}}.', readyList: 'Siap: {{count}} kata · {{mode}}.',
    originalSequential: 'Belajar sesuai urutan asli', originalSpawn: 'Muncul sesuai urutan asli', shuffled: 'Diacak', selectedOrder: '{{order}} dipilih.', contentVi: 'Konten bahasa Vietnam dipilih.', contentEn: 'Konten bahasa Inggris dipilih.', contentId: 'Konten Bahasa Indonesia dipilih.', restoredOrder: 'Urutan konten asli telah dipulihkan.', dedupeWarning: 'Menghapus duplikat dapat mengubah ritme dan makna pelajaran.', dedupeDone: 'Kemunculan pertama dipertahankan tanpa mengubah urutan sisanya.', deletedCustom: 'Daftar kustom tersimpan telah dihapus.', copiedList: 'Daftar kata disalin.', copyBlocked: 'Browser memblokir penyalinan otomatis.', emptyList: 'Daftar kosong.', loadedWords: 'Memuat {{count}} kata.', createdWords: 'Pelajaran {{count}} kata telah dibuat.', readingFile: 'Membaca file...', readFile: '{{name}} telah dibaca.', loadingContent: 'Memuat konten...', loadedFrom: 'Konten dimuat dari {{source}}.', otherWords: '+ {{count}} kata lainnya', editWord: 'Edit {{word}}', removeWord: 'Hapus {{word}}',
    gameControls: 'Kontrol permainan', sound: 'Suara', learningWord: 'KATA YANG DIPELAJARI', waitingTarget: 'Belum ada target terkunci', chooseTargetMeaning: 'Kunci target untuk melihat artinya.', meaningAfter: 'Arti muncul setelah kata selesai.', defaultSource: 'DEFAULT', courseLabel: 'KURSUS', lessonLabel: 'PELAJARAN', pauseTitle: 'Permainan dijeda', pauseDescription: 'Meteor, peluru, dan waktu berhenti. Tekan Escape untuk melanjutkan.', soundMixer: 'Mixer efek', masterVolume: 'Volume utama', gameEffects: 'Efek game', testShot: 'Coba suara tembakan', testExplosion: 'Coba suara ledakan', exitTitle: 'Hentikan permainan saat ini?', exitDescription: 'Skor saat ini tidak akan dicatat. Daftar kustom terakhir tetap tersimpan.', cancelContinue: 'BATAL - LANJUT BERMAIN', stopHome: 'BERHENTI DAN KE BERANDA', stopCustom: 'BERHENTI DAN BUAT LATIHAN', missionEnded: 'Misi selesai', missionSubtitle: 'Anda berhasil menjaga orbit.', lessonCompleted: 'PELAJARAN SELESAI', lessonPassed: 'Anda menyelesaikan “{{title}}”.', lessonRetry: 'Berlatih lagi untuk meningkatkan akurasi.', sequenceCompleted: 'Menyelesaikan {{current}} / {{total}} kata sesuai urutan.', starsSummary: '{{stars}} bintang · akurasi {{accuracy}}%', courseIncomplete: 'Pelajaran belum selesai; progres tidak berubah.', resultWords: 'Kata selesai', maxCombo: 'Combo terbaik', replay: 'LATIH / MAIN LAGI', editLesson: 'EDIT PELAJARAN', mainScreen: 'Kembali ke layar utama', shotCheckOk: 'Jumlah peluru cocok dengan karakter yang dikonfirmasi.', shotCheckBad: 'Jumlah peluru dan karakter yang dikonfirmasi berbeda.', fullscreenBlocked: 'Browser tidak mengizinkan layar penuh.', customSelected: 'Daftar kustom {{count}} kata dipilih.', lessonGenerated: 'Membuat “{{title}}” · variasi #{{variant}}.', presetApplied: 'Preset belajar cepat diterapkan.',
    engineStart: 'Level 1 · Pemanasan', engineLevel: 'Level {{level}} · {{name}}', levelName1: 'Pemanasan', levelName2: 'Percepatan', levelName3: 'Orbit padat', levelName4: 'Hujan meteor', levelName5: 'Komandan', wrongInput: 'Belum tepat - gunakan Backspace untuk memperbaiki', bossWarning: 'PERINGATAN: Meteor komandan!', courseRetryTarget: 'Tidak apa-apa - target akan kembali untuk dicoba lagi.', shieldDamage: 'Perisai -{{damage}}', engineLessonComplete: 'PELAJARAN SELESAI', noMeaning: 'Terjemahan belum tersedia', mobileWarning: 'Game ini dioptimalkan untuk komputer dengan papan ketik fisik.'
  }
});

UI_MESSAGES.vi.allowSymbols = 'Cho phép số và ký tự Shift';
UI_MESSAGES.en.allowSymbols = 'Allow numbers and Shift symbols';
UI_MESSAGES.id.allowSymbols = 'Izinkan angka dan simbol Shift';
UI_MESSAGES.vi.audioUnavailable = 'Trình duyệt chưa cho phép phát âm thanh. Hãy bấm lại nút âm thanh rồi thử lại.';
UI_MESSAGES.en.audioUnavailable = 'The browser did not allow game audio. Click the sound button and try again.';
UI_MESSAGES.id.audioUnavailable = 'Browser tidak mengizinkan suara game. Klik tombol suara lalu coba lagi.';

Object.assign(UI_MESSAGES.vi, {
  publicQuota: '⚡ Cần tối thiểu 10 từ hợp lệ (Hiện có: {{count}}). Hạn mức miễn phí: Còn {{remaining}}/{{limit}} lượt tạo bài hôm nay (Hệ thống tự làm mới sau 24h).',
  publicQuotaExhausted: '⚡ Bạn đã hết lượt tạo bài miễn phí hôm nay. Hệ thống tự làm mới sau 24h.',
  betaQuota: 'Beta miễn phí: còn {{remaining}}/{{limit}} lượt tạo bài, tối đa {{wordLimit}} từ/lần.',
  betaUnlimited: 'Beta miễn phí không giới hạn cho ngôn ngữ này.',
  betaWordLimit: 'Bản beta miễn phí tối đa 16 từ/lần. Hiện có {{count}} từ; hãy giảm còn {{limit}} từ.',
  betaQuotaExhausted: 'Bạn đã dùng hết {{limit}} lượt dán văn bản miễn phí trên thiết bị này.',
  betaLockedLesson: 'Bài này đang khóa trong beta. Bạn có thể xem trước; quyền học sẽ mở ở gói trả phí.',
  betaLockedAdaptive: 'Bài thích nghi nâng cao đang khóa trong beta.',
  betaLockedShort: 'KHÓA',
  betaAccessSummary: 'Beta: {{count}} bài tiếng Việt miễn phí; tiếng Anh và Indonesia mở để thử.',
  betaReady: 'Sẵn sàng: {{count}} từ · {{mode}} · còn {{remaining}} lượt beta.'
});
Object.assign(UI_MESSAGES.en, {
  publicQuota: '⚡ At least 10 valid words are required (Current: {{count}}). Free limit: {{remaining}}/{{limit}} lesson creations left today (Automatically resets after 24 hours).',
  publicQuotaExhausted: '⚡ You have used all free lesson creations today. The limit resets after 24 hours.',
  betaQuota: 'Free beta: {{remaining}}/{{limit}} lesson creations left, up to {{wordLimit}} words each.',
  betaUnlimited: 'Unlimited during beta for this language.',
  betaWordLimit: 'Free beta allows up to 16 words per lesson. This list has {{count}}; reduce it to {{limit}}.',
  betaQuotaExhausted: 'You have used all {{limit}} free pasted-text lesson creations on this device.',
  betaLockedLesson: 'This lesson is locked in beta. You can preview it; learning access will be part of the paid plan.',
  betaLockedAdaptive: 'Adaptive advanced practice is locked in beta.',
  betaLockedShort: 'LOCKED',
  betaAccessSummary: 'Beta: {{count}} Vietnamese lessons are free; English and Indonesian are open to try.',
  betaReady: 'Ready: {{count}} words · {{mode}} · {{remaining}} beta uses left.'
});
Object.assign(UI_MESSAGES.id, {
  betaQuota: 'Beta gratis: tersisa {{remaining}}/{{limit}} pembuatan pelajaran, maksimal {{wordLimit}} kata setiap kali.',
  betaUnlimited: 'Tidak terbatas selama beta untuk bahasa ini.',
  betaWordLimit: 'Beta gratis maksimal 16 kata per pelajaran. Daftar ini memiliki {{count}}; kurangi menjadi {{limit}}.',
  betaQuotaExhausted: 'Anda telah menggunakan semua {{limit}} pembuatan pelajaran dari teks tempel gratis di perangkat ini.',
  betaLockedLesson: 'Pelajaran ini terkunci dalam beta. Anda dapat melihat pratinjau; akses belajar tersedia dalam paket berbayar.',
  betaLockedAdaptive: 'Latihan adaptif lanjutan terkunci selama beta.',
  betaLockedShort: 'TERKUNCI',
  betaAccessSummary: 'Beta: {{count}} pelajaran bahasa Vietnam gratis; bahasa Inggris dan Indonesia terbuka untuk dicoba.',
  betaReady: 'Siap: {{count}} kata · {{mode}} · tersisa {{remaining}} penggunaan beta.'
});

Object.assign(UI_MESSAGES.vi, {
  missingMeaningHint: 'Còn {{count}} mục chưa có nghĩa. Với từ lạ, nhập theo dạng: word = nghĩa tiếng Việt.'
});
Object.assign(UI_MESSAGES.en, {
  missingMeaningHint: '{{count}} entries have no meaning. For uncommon words, enter them as: word = Vietnamese meaning.'
});
Object.assign(UI_MESSAGES.id, {
  missingMeaningHint: '{{count}} entri belum memiliki arti. Untuk kata khusus, masukkan dengan format: word = arti bahasa Vietnam.'
});

Object.assign(UI_MESSAGES.vi, {
  ocrReviewHelp: 'So sánh bản gốc và bản đã sửa trước khi dùng.',
  ocrCorrectedVersion: 'Bản đã sửa - có thể chỉnh tiếp',
  ocrRawVersion: 'Bản OCR gốc - chỉ để đối chiếu',
  ocrRawPlaceholder: 'Bản OCR gốc xuất hiện tại đây.',
  ocrUseRaw: 'Dùng bản OCR gốc',
  ocrRestoreCorrected: 'Khôi phục bản đã sửa',
  ocrCorrectionSummary: 'Đã sửa {{count}} lỗi OCR chắc chắn. Phần thay đổi được đánh dấu bên dưới.',
  ocrAiCompared: '{{provider}} đã tạo bản sửa; OCR tại máy được giữ bên cạnh để đối chiếu.',
  ocrNoCorrections: 'Không phát hiện lỗi chắc chắn để tự sửa. Bạn vẫn nên đọc lại nội dung.',
  ocrDiffPreview: 'Phần thay đổi: chữ đỏ bị loại, chữ xanh được dùng.',
  ocrDiffTooLong: 'Văn bản dài; hãy so sánh trực tiếp hai cột bên dưới.',
  ocrFallbackLocal: 'API không trả kết quả; đang dùng bản OCR tại máy đã được làm sạch.',
  ocrProofread: 'SOÁT LỖI BẰNG AI',
  ocrProofreadUnavailable: 'Chưa có Gemini hoặc OpenAI sẵn sàng. Hãy cấu hình API trong config/ocr.config.js.',
  ocrAiProofreadSummary: '{{provider}} đã soát lỗi bản đang chỉnh sửa; bản OCR gốc vẫn được giữ để đối chiếu.',
  ocrAiProofreadComplete: '{{provider}} đã soát lỗi xong. Hãy đọc lại trước khi tạo bài.'
});
Object.assign(UI_MESSAGES.en, {
  ocrReviewHelp: 'Compare the original and corrected versions before using the text.',
  ocrCorrectedVersion: 'Corrected version - still editable',
  ocrRawVersion: 'Original OCR - comparison only',
  ocrRawPlaceholder: 'The original OCR result appears here.',
  ocrUseRaw: 'Use original OCR',
  ocrRestoreCorrected: 'Restore corrected version',
  ocrCorrectionSummary: '{{count}} high-confidence OCR errors were corrected. Changes are highlighted below.',
  ocrAiCompared: '{{provider}} created the corrected version; local OCR is kept beside it for comparison.',
  ocrNoCorrections: 'No high-confidence correction was found. Review the text before using it.',
  ocrDiffPreview: 'Changes: red text was removed and green text is used.',
  ocrDiffTooLong: 'This text is long; compare the two columns directly below.',
  ocrFallbackLocal: 'The API returned no result; the cleaned local OCR version is being used.',
  ocrProofread: 'PROOFREAD WITH AI',
  ocrProofreadUnavailable: 'No Gemini or OpenAI provider is ready. Configure an API in config/ocr.config.js.',
  ocrAiProofreadSummary: '{{provider}} proofread the editable version; the original OCR is still kept for comparison.',
  ocrAiProofreadComplete: '{{provider}} finished proofreading. Review it before creating the lesson.'
});
Object.assign(UI_MESSAGES.id, {
  ocrReviewHelp: 'Bandingkan versi asli dan versi yang diperbaiki sebelum digunakan.',
  ocrCorrectedVersion: 'Versi diperbaiki - masih dapat diedit',
  ocrRawVersion: 'OCR asli - hanya untuk perbandingan',
  ocrRawPlaceholder: 'Hasil OCR asli muncul di sini.',
  ocrUseRaw: 'Gunakan OCR asli',
  ocrRestoreCorrected: 'Pulihkan versi diperbaiki',
  ocrCorrectionSummary: '{{count}} kesalahan OCR yang pasti telah diperbaiki. Perubahan ditandai di bawah.',
  ocrAiCompared: '{{provider}} membuat versi perbaikan; OCR lokal disimpan di sampingnya untuk perbandingan.',
  ocrNoCorrections: 'Tidak ada koreksi yang cukup pasti. Periksa kembali teks sebelum digunakan.',
  ocrDiffPreview: 'Perubahan: teks merah dihapus dan teks hijau digunakan.',
  ocrDiffTooLong: 'Teks ini panjang; bandingkan langsung dua kolom di bawah.',
  ocrFallbackLocal: 'API tidak memberi hasil; versi OCR lokal yang dibersihkan digunakan.',
  ocrProofread: 'PERIKSA EJAAN DENGAN AI',
  ocrProofreadUnavailable: 'Gemini atau OpenAI belum siap. Konfigurasikan API di config/ocr.config.js.',
  ocrAiProofreadSummary: '{{provider}} memeriksa versi yang dapat diedit; OCR asli tetap disimpan untuk perbandingan.',
  ocrAiProofreadComplete: '{{provider}} selesai memeriksa ejaan. Periksa sebelum membuat pelajaran.'
});

Object.assign(UI_MESSAGES.vi, {
  miniGamesArea: 'Khu trò chơi bổ trợ',
  miniTab: 'TRÒ CHƠI BỔ TRỢ', miniEyebrow: 'TRÒ CHƠI BỔ TRỢ · BẢN BETA MIỄN PHÍ',
  miniTitle: 'Học từ bằng cách chơi.', miniIntro: 'Luyện nghĩa và phản xạ với kho từ Việt, Anh và Indonesia. Giọng đọc tiếng Việt dùng Gemini TTS.',
  miniSettings: 'Thiết lập trò chơi bổ trợ', miniTypingLanguage: 'Ngôn ngữ của từ', miniMeaningLanguage: 'Ngôn ngữ giải nghĩa', miniTopic: 'Chủ đề', miniLesson: 'Bài học',
  miniAllTopics: 'Tất cả chủ đề', miniAllLessons: 'Tất cả bài học', miniPaidLessons: 'bài trả phí · xem trước', miniTopicStatus: 'Chủ đề: {{label}} · {{count}} từ', miniLessonStatus: 'Bài học: {{label}} · {{count}} từ', miniAllTopicsStatus: 'Tất cả chủ đề · {{count}} từ', miniPracticeTopic: 'CHƠI ÔN CHỦ ĐỀ', miniNoTopicWords: 'Chủ đề này chưa có từ phù hợp.',
  miniOfflineNote: 'Từ vựng, tiến độ và cài đặt giọng được lưu trên thiết bị. Chỉ văn bản tiếng Việt cần đọc mới được gửi đến Gemini khi bạn chọn Gemini TTS.', miniFreeBeta: 'BETA MIỄN PHÍ',
  miniBestScore: 'Kỷ lục {{score}} điểm', miniPlays: '{{count}} lượt', miniPlay: 'CHƠI',
  miniVietnamese: 'Tiếng Việt', miniEnglish: 'English', miniIndonesian: 'Bahasa Indonesia',
  miniTruthTitle: 'Đúng hay Sai', miniTruthDescription: 'Đọc từ và nghĩa, rồi chọn đúng hoặc sai trong thời gian ngắn.',
  miniChoiceTitle: 'Chọn Nghĩa', miniChoiceDescription: 'Chọn bản dịch chính xác giữa các đáp án.',
  miniClimbTitle: 'Dino Leo Núi', miniClimbDescription: 'Chọn nghĩa đúng để leo từng bậc và chạm đỉnh.',
  miniTime: 'Thời gian còn lại', miniRound: 'Lượt {{current}} / {{total}}', miniScore: 'Điểm', miniStreak: 'Chuỗi đúng',
  miniPrompt: 'Từ đang học', miniMeaningIn: 'Nghĩa bằng {{language}}', miniTrue: 'ĐÚNG', miniFalse: 'SAI',
  miniCorrect: 'Chính xác!', miniWrong: 'Chưa đúng', miniTimeout: 'Hết giờ', miniCorrectAnswer: 'Đáp án đúng: {{answer}}',
  miniFinish: 'XEM KẾT QUẢ', miniNext: 'TIẾP THEO', miniChapter: 'Chương {{current}} / {{total}}', miniChapterComplete: 'Hoàn thành chương!', miniNextChapter: 'TIẾP CHƯƠNG', miniClimbProgress: 'Tiến độ leo núi', miniBackToGames: 'Kho trò chơi',
  miniComplete: 'Hoàn thành!', miniPoints: 'điểm', miniAccuracy: 'Độ chính xác', miniCorrectCount: 'Câu đúng',
  miniBestScoreLabel: 'Kỷ lục', miniBestStreak: 'Chuỗi tốt nhất', miniPlayAgain: 'CHƠI LẠI',
  miniVoiceTitle: 'Giọng đọc tiếng Việt', miniVoiceEnabled: 'Bật giọng đọc', miniVoiceAutoSpeak: 'Tự đọc từ và đáp án tiếng Việt',
  miniVoiceProvider: 'Nguồn giọng', miniVoiceGemini: 'Gemini TTS · mặc định', miniVoiceFuture: 'Nguồn giọng mới · Sắp có',
  miniVoiceRate: 'Tốc độ đọc', miniVoiceSlow: 'Chậm', miniVoiceNormal: 'Bình thường', miniVoiceFast: 'Nhanh', miniVoiceVolume: 'Âm lượng',
  miniVoiceTest: 'NGHE THỬ', miniVoiceTestPhrase: 'Xin chào, chúng ta cùng học từ vựng tiếng Việt.', miniVoiceRepeat: '🔊 Nghe từ', miniVoiceHearAnswer: '🔊 Nghe đáp án',
  miniVoiceReady: 'Sẵn sàng', miniVoiceLoading: 'Gemini đang tạo giọng', miniVoiceSpeaking: 'Đang đọc bằng Gemini', miniVoiceUnavailable: 'Gemini TTS chưa sẵn sàng', miniVoiceError: 'Gemini không đọc được'
});
Object.assign(UI_MESSAGES.en, {
  miniGamesArea: 'Mini-game area',
  miniTab: 'MINI-GAMES', miniEyebrow: 'MINI-GAMES · FREE BETA',
  miniTitle: 'Learn words by playing.', miniIntro: 'Practice meaning and reflexes with Vietnamese, English, and Indonesian words. Vietnamese speech uses Gemini TTS.',
  miniSettings: 'Mini-game settings', miniTypingLanguage: 'Word language', miniMeaningLanguage: 'Meaning language', miniTopic: 'Topic', miniLesson: 'Lesson',
  miniAllTopics: 'All topics', miniAllLessons: 'All lessons', miniPaidLessons: 'paid · preview', miniTopicStatus: 'Topic: {{label}} · {{count}} words', miniLessonStatus: 'Lesson: {{label}} · {{count}} words', miniAllTopicsStatus: 'All topics · {{count}} words', miniPracticeTopic: 'PRACTICE TOPIC', miniNoTopicWords: 'This topic has no matching words.',
  miniOfflineNote: 'Vocabulary, progress, and voice settings stay on this device. Only Vietnamese text being spoken is sent to Gemini when Gemini TTS is selected.', miniFreeBeta: 'FREE BETA',
  miniBestScore: 'Best {{score}} points', miniPlays: '{{count}} plays', miniPlay: 'PLAY',
  miniVietnamese: 'Vietnamese', miniEnglish: 'English', miniIndonesian: 'Indonesian',
  miniTruthTitle: 'True or False', miniTruthDescription: 'Read the word and meaning, then answer true or false before time runs out.',
  miniChoiceTitle: 'Meaning Choice', miniChoiceDescription: 'Choose the correct translation from the answers.',
  miniClimbTitle: 'Dino Mountain Climb', miniClimbDescription: 'Choose the right meaning to climb each step and reach the summit.',
  miniTime: 'Time left', miniRound: 'Round {{current}} / {{total}}', miniScore: 'Score', miniStreak: 'Streak',
  miniPrompt: 'Word in play', miniMeaningIn: 'Meaning in {{language}}', miniTrue: 'TRUE', miniFalse: 'FALSE',
  miniCorrect: 'Correct!', miniWrong: 'Not quite', miniTimeout: 'Time up', miniCorrectAnswer: 'Correct answer: {{answer}}',
  miniFinish: 'VIEW RESULTS', miniNext: 'NEXT', miniChapter: 'Chapter {{current}} / {{total}}', miniChapterComplete: 'Chapter complete!', miniNextChapter: 'NEXT CHAPTER', miniClimbProgress: 'Climb progress', miniBackToGames: 'Mini-games',
  miniComplete: 'Complete!', miniPoints: 'points', miniAccuracy: 'Accuracy', miniCorrectCount: 'Correct',
  miniBestScoreLabel: 'Best score', miniBestStreak: 'Best streak', miniPlayAgain: 'PLAY AGAIN',
  miniVoiceTitle: 'Vietnamese voice', miniVoiceEnabled: 'Enable voice', miniVoiceAutoSpeak: 'Auto-read Vietnamese prompts and answers',
  miniVoiceProvider: 'Voice source', miniVoiceGemini: 'Gemini TTS · default', miniVoiceFuture: 'New voice source · Coming soon',
  miniVoiceRate: 'Reading speed', miniVoiceSlow: 'Slow', miniVoiceNormal: 'Normal', miniVoiceFast: 'Fast', miniVoiceVolume: 'Volume',
  miniVoiceTest: 'TEST VOICE', miniVoiceTestPhrase: 'Xin chào, chúng ta cùng học từ vựng tiếng Việt.', miniVoiceRepeat: '🔊 Hear word', miniVoiceHearAnswer: '🔊 Hear answer',
  miniVoiceReady: 'Ready', miniVoiceLoading: 'Gemini is creating audio', miniVoiceSpeaking: 'Reading with Gemini', miniVoiceUnavailable: 'Gemini TTS is not ready', miniVoiceError: 'Gemini could not read this'
});
Object.assign(UI_MESSAGES.id, {
  miniGamesArea: 'Area mini-game',
  miniTab: 'MINI-GAME', miniEyebrow: 'MINI-GAME · BETA GRATIS',
  miniTitle: 'Belajar kata sambil bermain.', miniIntro: 'Latih arti dan refleks dengan kata Vietnam, Inggris, dan Indonesia. Suara Vietnam menggunakan Gemini TTS.',
  miniSettings: 'Pengaturan mini-game', miniTypingLanguage: 'Bahasa kata', miniMeaningLanguage: 'Bahasa arti', miniTopic: 'Topik', miniLesson: 'Pelajaran',
  miniAllTopics: 'Semua topik', miniAllLessons: 'Semua pelajaran', miniPaidLessons: 'berbayar · pratinjau', miniTopicStatus: 'Topik: {{label}} · {{count}} kata', miniLessonStatus: 'Pelajaran: {{label}} · {{count}} kata', miniAllTopicsStatus: 'Semua topik · {{count}} kata', miniPracticeTopic: 'LATIH TOPIK', miniNoTopicWords: 'Topik ini tidak memiliki kata yang cocok.',
  miniOfflineNote: 'Kosakata, progres, dan pengaturan suara tetap di perangkat ini. Hanya teks Vietnam yang dibacakan dikirim ke Gemini saat Gemini TTS dipilih.', miniFreeBeta: 'BETA GRATIS',
  miniBestScore: 'Rekor {{score}} poin', miniPlays: '{{count}} kali', miniPlay: 'MAIN',
  miniVietnamese: 'Vietnam', miniEnglish: 'Inggris', miniIndonesian: 'Bahasa Indonesia',
  miniTruthTitle: 'Benar atau Salah', miniTruthDescription: 'Baca kata dan artinya, lalu pilih benar atau salah sebelum waktu habis.',
  miniChoiceTitle: 'Pilih Arti', miniChoiceDescription: 'Pilih terjemahan yang tepat dari beberapa jawaban.',
  miniClimbTitle: 'Dino Mendaki Gunung', miniClimbDescription: 'Pilih arti yang tepat untuk menaiki setiap langkah sampai puncak.',
  miniTime: 'Waktu tersisa', miniRound: 'Putaran {{current}} / {{total}}', miniScore: 'Skor', miniStreak: 'Rangkaian benar',
  miniPrompt: 'Kata yang dipelajari', miniMeaningIn: 'Arti dalam {{language}}', miniTrue: 'BENAR', miniFalse: 'SALAH',
  miniCorrect: 'Benar!', miniWrong: 'Belum tepat', miniTimeout: 'Waktu habis', miniCorrectAnswer: 'Jawaban benar: {{answer}}',
  miniFinish: 'LIHAT HASIL', miniNext: 'BERIKUTNYA', miniChapter: 'Bab {{current}} / {{total}}', miniChapterComplete: 'Bab selesai!', miniNextChapter: 'BAB BERIKUTNYA', miniClimbProgress: 'Progres pendakian', miniBackToGames: 'Mini-game',
  miniComplete: 'Selesai!', miniPoints: 'poin', miniAccuracy: 'Akurasi', miniCorrectCount: 'Jawaban benar',
  miniBestScoreLabel: 'Rekor', miniBestStreak: 'Rangkaian terbaik', miniPlayAgain: 'MAIN LAGI',
  miniVoiceTitle: 'Suara bahasa Vietnam', miniVoiceEnabled: 'Aktifkan suara', miniVoiceAutoSpeak: 'Baca otomatis kata dan jawaban Vietnam',
  miniVoiceProvider: 'Sumber suara', miniVoiceGemini: 'Gemini TTS · default', miniVoiceFuture: 'Sumber suara baru · Segera hadir',
  miniVoiceRate: 'Kecepatan baca', miniVoiceSlow: 'Lambat', miniVoiceNormal: 'Normal', miniVoiceFast: 'Cepat', miniVoiceVolume: 'Volume',
  miniVoiceTest: 'COBA SUARA', miniVoiceTestPhrase: 'Xin chào, chúng ta cùng học từ vựng tiếng Việt.', miniVoiceRepeat: '🔊 Dengar kata', miniVoiceHearAnswer: '🔊 Dengar jawaban',
  miniVoiceReady: 'Siap', miniVoiceLoading: 'Gemini membuat audio', miniVoiceSpeaking: 'Membaca dengan Gemini', miniVoiceUnavailable: 'Gemini TTS belum siap', miniVoiceError: 'Gemini tidak dapat membaca'
});

export function normalizeUiLanguage(value) {
  return SUPPORTED_UI_LANGUAGES.includes(value) ? value : 'vi';
}

export function uiLocale(language) {
  const lang = normalizeUiLanguage(language);
  return lang === 'en' ? 'en-US' : lang === 'id' ? 'id-ID' : 'vi-VN';
}

export const OCR_LANGUAGE_MESSAGES = Object.freeze({
  vi: Object.freeze({
    ocrLanguageVi: 'Tiếng Việt', ocrLanguageViEn: 'Tiếng Việt + English', ocrLanguageViId: 'Tiếng Việt + Bahasa Indonesia', ocrLanguageEn: 'English', ocrLanguageId: 'Bahasa Indonesia', ocrLanguageIdEn: 'Bahasa Indonesia + English',
    ocrLoadingViOnly: 'Đang tải mô hình tiếng Việt', ocrLoadingViEn: 'Đang tải mô hình tiếng Việt + English', ocrLoadingViId: 'Đang tải mô hình tiếng Việt + Indonesia', ocrLoadingIdEn: 'Đang tải mô hình tiếng Indonesia + English',
    ocrRecognizedViOnly: 'Đã nhận dạng ảnh tiếng Việt. Hãy kiểm tra lại dấu.', ocrRecognizedViEn: 'Đã nhận dạng ảnh Việt + English. Hãy kiểm tra lại nội dung.', ocrRecognizedViId: 'Đã nhận dạng ảnh Việt + Indonesia. Hãy kiểm tra lại nội dung.', ocrRecognizedIdEn: 'Đã nhận dạng ảnh Indonesia + English. Hãy kiểm tra lại nội dung.'
  }),
  en: Object.freeze({
    ocrLanguageVi: 'Vietnamese', ocrLanguageViEn: 'Vietnamese + English', ocrLanguageViId: 'Vietnamese + Indonesian', ocrLanguageEn: 'English', ocrLanguageId: 'Indonesian', ocrLanguageIdEn: 'Indonesian + English',
    ocrLoadingViOnly: 'Loading Vietnamese model', ocrLoadingViEn: 'Loading Vietnamese + English models', ocrLoadingViId: 'Loading Vietnamese + Indonesian models', ocrLoadingIdEn: 'Loading Indonesian + English models',
    ocrRecognizedViOnly: 'Vietnamese image recognized. Review all diacritics.', ocrRecognizedViEn: 'Vietnamese + English image recognized. Review the result.', ocrRecognizedViId: 'Vietnamese + Indonesian image recognized. Review the result.', ocrRecognizedIdEn: 'Indonesian + English image recognized. Review the result.'
  }),
  id: Object.freeze({
    ocrLanguageVi: 'Vietnam', ocrLanguageViEn: 'Vietnam + Inggris', ocrLanguageViId: 'Vietnam + Indonesia', ocrLanguageEn: 'Inggris', ocrLanguageId: 'Bahasa Indonesia', ocrLanguageIdEn: 'Bahasa Indonesia + Inggris',
    ocrLoadingViOnly: 'Memuat model bahasa Vietnam', ocrLoadingViEn: 'Memuat model bahasa Vietnam + Inggris', ocrLoadingViId: 'Memuat model bahasa Vietnam + Indonesia', ocrLoadingIdEn: 'Memuat model bahasa Indonesia + Inggris',
    ocrRecognizedViOnly: 'Gambar bahasa Vietnam dikenali. Periksa kembali semua diakritik.', ocrRecognizedViEn: 'Gambar Vietnam + Inggris dikenali. Periksa hasilnya.', ocrRecognizedViId: 'Gambar Vietnam + Indonesia dikenali. Periksa hasilnya.', ocrRecognizedIdEn: 'Gambar Indonesia + Inggris dikenali. Periksa hasilnya.'
  })
});

export function t(language, key, replacements = {}) {
  const lang = normalizeUiLanguage(language);
  const template = ARCADE_MESSAGES[lang]?.[key] ?? UI_MESSAGES[lang]?.[key] ?? OCR_LANGUAGE_MESSAGES[lang]?.[key] ?? ARCADE_MESSAGES.vi[key] ?? UI_MESSAGES.vi[key] ?? OCR_LANGUAGE_MESSAGES.vi[key] ?? key;
  return String(template).replace(/\{\{(\w+)\}\}/g, (_match, name) => String(replacements[name] ?? ''));
}

export function formatSpeedLabel(language, difficulty) {
  const keys = { slowest:'slowest', 'very-slow':'verySlow', slow:'slow', medium:'medium', fast:'fast', 'very-fast':'veryFast', dynamic:'dynamic' };
  const label = t(language,keys[difficulty] || difficulty || 'medium');
  const seconds = GAME_CONFIG.targetTravelSeconds[difficulty];
  return seconds ? t(language,'speedSeconds',{label,seconds}) : label;
}

export function formatNumber(value, language = 'vi') {
  return Number(value || 0).toLocaleString(uiLocale(language));
}

export function applyTranslations(root, language) {
  const lang = normalizeUiLanguage(language);
  root.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = t(lang, element.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    element.setAttribute('placeholder', t(lang, element.dataset.i18nPlaceholder));
  });
  root.querySelectorAll('[data-i18n-title]').forEach((element) => {
    element.setAttribute('title', t(lang, element.dataset.i18nTitle));
  });
  root.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
    element.setAttribute('aria-label', t(lang, element.dataset.i18nAriaLabel));
  });
}

export { SUPPORTED_UI_LANGUAGES };
