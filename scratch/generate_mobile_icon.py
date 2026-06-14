import os
from PIL import Image

def generate_mobile_icon():
    src_path = "C:/Users/PIQ/.gemini/antigravity/brain/f977cf73-ac5d-4624-8d63-b5599936b1be/media__1781388601229.png"
    out_path = "E:/AI AGENT/Kost/kostmanager-main/public/mobile-app-icon.png"

    if not os.path.exists(src_path):
        print(f"Error: Source image not found at {src_path}")
        return

    img = Image.open(src_path).convert("RGBA")
    width, height = img.size
    
    # 1. Bounding box scan for the icon part (x: 50 to 400, y: 150 to 400)
    pixels = img.load()
    icon_left, icon_top, icon_right, icon_bottom = width, height, 0, 0
    for y in range(150, 400):
        for x in range(50, 400):
            r, g, b, a = pixels[x, y]
            # Scan for non-white/colored pixels
            if a > 0 and (r < 248 or g < 248 or b < 248):
                if x < icon_left: icon_left = x
                if y < icon_top: icon_top = y
                if x > icon_right: icon_right = x
                if y > icon_bottom: icon_bottom = y

    # Crop the icon
    icon_part = img.crop((icon_left, icon_top, icon_right, icon_bottom))
    
    # Create 512x512 square canvas with white background
    app_icon = Image.new("RGBA", (512, 512), (255, 255, 255, 255))
    
    # Resize icon part to fit nicely inside 512x512 (e.g. max width/height of 320px for good margins)
    target_size = 320
    icon_w, icon_h = icon_part.size
    ratio = min(target_size / icon_w, target_size / icon_h)
    new_w = int(icon_w * ratio)
    new_h = int(icon_h * ratio)
    
    resized_icon = icon_part.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # Paste resized icon onto the center of the canvas
    paste_x = (512 - new_w) // 2
    paste_y = (512 - new_h) // 2
    
    # Composite using alpha channel to retain transparency of the logo itself
    app_icon.alpha_composite(resized_icon, (paste_x, paste_y))
    
    # Convert to RGB to save as solid PNG
    final_icon = app_icon.convert("RGB")
    final_icon.save(out_path, "PNG")
    print(f"Success: Mobile app icon generated at {out_path}")

if __name__ == "__main__":
    generate_mobile_icon()
