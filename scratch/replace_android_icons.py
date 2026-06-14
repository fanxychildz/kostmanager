import os
from PIL import Image

def resize_and_replace():
    icon_path = "E:/AI AGENT/Kost/kostmanager-main/public/mobile-app-icon.png"
    res_dir = "E:/AI AGENT/Kost/kostmanager-main/android/app/src/main/res"

    if not os.path.exists(icon_path):
        print(f"Error: Icon not found at {icon_path}")
        return

    # Sizes map (Folder Name -> Size in pixels)
    sizes = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192
    }

    img = Image.open(icon_path).convert("RGBA")

    for folder, size in sizes.items():
        folder_path = os.path.join(res_dir, folder)
        if not os.path.exists(folder_path):
            os.makedirs(folder_path)

        resized = img.resize((size, size), Image.Resampling.LANCZOS)
        
        # Replace normal launcher icon
        normal_path = os.path.join(folder_path, "ic_launcher.png")
        resized.save(normal_path, "PNG")
        print(f"Replaced normal icon: {normal_path} ({size}x{size})")

        # Replace round launcher icon
        round_path = os.path.join(folder_path, "ic_launcher_round.png")
        resized.save(round_path, "PNG")
        print(f"Replaced round icon: {round_path} ({size}x{size})")

    print("\nSuccess: Android launcher icons successfully updated!")

if __name__ == "__main__":
    resize_and_replace()
