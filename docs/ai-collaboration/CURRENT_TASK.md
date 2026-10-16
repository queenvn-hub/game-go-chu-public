# Public Release Task

## Trạng thái

Đang chuẩn bị phát hành bản public từ mã nguồn website private.

## Đã thực hiện

- Root public dùng giao diện chính, không dùng trang đăng nhập.
- Bản public giữ 9 bài cơ bản và khóa bài 10-33 theo policy hiện có.
- Gỡ các thư mục route đăng nhập/admin khỏi bản public.
- Tắt gọi API tài khoản/quota private trong public mode.
- Tạo quota tạo màn client-side 10 lượt/ngày, tự reset theo ngày.
- Bỏ giới hạn từ 16 và giới hạn ứng dụng 2.000 mục trong bản public.

## Còn phải xác minh

- Chạy browser smoke cho root, khóa bài, tạo màn và reset quota.
- Kiểm tra public domain `https://gamegochu.name.vn/` sau khi cấu hình GitHub Pages/DNS.
- Xác nhận repository public nhận commit/push thành công.
