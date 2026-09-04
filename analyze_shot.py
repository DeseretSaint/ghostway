from PIL import Image
import os

# Open the screenshot
path = '/Users/brdpest/projects/ghostway/ux-shots/mobile-390-optcompact-routecard.png'
img = Image.open(path)
print(f'Image size: {img.size}')
print(f'Image mode: {img.mode}')

# Try OCR with pytesseract if available
try:
    import pytesseract
    text = pytesseract.image_to_string(img)
    print('\n=== OCR TEXT ===')
    print(text)
except ImportError:
    print('pytesseract not available')
except Exception as e:
    print(f'OCR error: {e}')

# Analyze pixel colors in the route card area
# The route card is typically in the lower portion of the screen
w, h = img.size
print(f'\n=== PIXEL ANALYSIS ===')
print(f'Image dimensions: {w}x{h}')

# Sample colors from different regions
# Top region (search area)
top_region = img.crop((0, 0, w, h//4))
# Middle region (map)
mid_region = img.crop((0, h//4, w, h//2))
# Bottom region (route card)
bottom_region = img.crop((0, h//2, w, h))

# Get average colors
def avg_color(region):
    pixels = list(region.getdata())
    if not pixels:
        return (0, 0, 0)
    r = sum(p[0] for p in pixels) // len(pixels)
    g = sum(p[1] for p in pixels) // len(pixels)
    b = sum(p[2] for p in pixels) // len(pixels)
    return (r, g, b)

print(f'Top region avg color: {avg_color(top_region)}')
print(f'Mid region avg color: {avg_color(mid_region)}')
print(f'Bottom region avg color: {avg_color(bottom_region)}')

# Check for text-like patterns (high contrast areas)
# Convert to grayscale and look for edges
gray = img.convert('L')
# Save a cropped version of just the route card area for inspection
route_card_crop = img.crop((0, h//2, w, h))
route_card_crop.save('/Users/brdpest/projects/ghostway/ux-shots/route-card-crop.png')
print('\nSaved route card crop to route-card-crop.png')
