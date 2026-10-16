# Game Go Chu Public

Bản public của Phi Đội Ngôn Từ, dành cho mọi người truy cập trực tiếp tại `https://gamegochu.name.vn/`.

## Phạm vi public

- Mở 9 bài cơ bản; các bài từ 10 đến 33 không mở trong bản public.
- Giữ các trò chơi bổ trợ, song ngữ Việt/Anh, âm thanh và bộ gõ hiện có.
- Tạo màn chơi cần tối thiểu 10 từ hợp lệ, không giới hạn số từ ở cấp ứng dụng.
- Mỗi trình duyệt có 10 lượt tạo bài miễn phí mỗi ngày; lượt tự làm mới sau 24 giờ/ngày mới.
- Không có đăng nhập, tài khoản phụ huynh/học sinh hoặc quyền truy cập private.

## Chạy local

Phục vụ thư mục này bằng static server, ví dụ `npx serve .`, rồi mở địa chỉ server trả về. GitHub Pages có thể xuất bản trực tiếp từ root của nhánh `main`.

## Ghi chú

Quota tạo màn là client-side bằng `localStorage`, vì vậy phù hợp cho bản public miễn phí nhưng không phải cơ chế chống gian lận. Bản private và Worker riêng không thuộc repository này.
