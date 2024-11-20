from PIL import Image
import cairosvg
import os

# 创建icons目录
if not os.path.exists('icons'):
    os.makedirs('icons')

# 需要生成的尺寸
sizes = [16, 32, 48, 128]

# 转换SVG到不同尺寸的PNG
for size in sizes:
    output_file = f'icons/icon{size}.png'
    cairosvg.svg2png(
        url="icons/icon.svg",
        write_to=output_file,
        output_width=size,
        output_height=size
    )
    print(f"Generated {output_file}") 