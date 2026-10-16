# Changelog AI

## 2026-10-16 - Public release preparation

- Tạo bản public độc lập từ thư mục `public/` của website private.
- Loại route `access/` và `admin/` khỏi bản public.
- Thêm `publicMode` để không gọi API xác thực/quota private.
- Giữ 9 bài cơ bản và khóa các bài còn lại.
- Đổi tạo màn thành 10 lượt/ngày bằng `localStorage`, tự làm mới theo ngày.
- Bỏ giới hạn từ 16 và giới hạn ứng dụng 2.000 mục trong bản public.
- Chưa coi deployment/domain là hoàn tất trước khi kiểm tra URL thực tế.
# Public Worker deployment configuration

- Added the public Worker entrypoint and Wrangler asset configuration so Cloudflare serves this repository as the live static site.

