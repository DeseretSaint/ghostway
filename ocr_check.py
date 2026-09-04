from PIL import Image
import os

# Open the image
img = Image.open('/Users/brdpest/projects/ghostway/ux-shots/mobile-390-routecard.png')
print(f'Image size: {img.size}')
print(f'Image mode: {img.mode}')

# Try to use pytesseract for OCR
try:
    import pytesseract
    text = pytesseract.image_to_string(img)
    print('OCR text:')
    print(text[:3000])
except ImportError:
    print('pytesseract not available')
except Exception as e:
    print(f'OCR error: {e}')
