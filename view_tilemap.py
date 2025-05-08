from PIL import Image
import sys

# Load the image
image_path = "./waveclient/public/assets/tilesetwhite.png"  # Change this to your image file path
img = Image.open(image_path)

# Constants
CHUNK_WIDTH = 11
CHUNK_HEIGHT = 11
UPSCALED_SIZE = (44, 44)

# Calculate how many chunks exist
total_chunks = img.width // CHUNK_WIDTH

def view_chunk(index):
    if index < 0 or index >= total_chunks:
        print(f"Invalid index. Please enter a value between 0 and {total_chunks - 1}")
        return

    left = index * CHUNK_WIDTH
    upper = 0
    right = left + CHUNK_WIDTH
    lower = upper + CHUNK_HEIGHT

    chunk = img.crop((left, upper, right, lower))
    upscaled_chunk = chunk.resize(UPSCALED_SIZE, Image.NEAREST)
    upscaled_chunk.save("chunk_temp.png")
    upscaled_chunk.show()

# Example usage
if __name__ == "__main__":
    while True:
        try:
            idx = int(input(f"Enter chunk index (0 to {total_chunks - 1}, or -1 to exit): "))
            if idx == -1:
                break
            view_chunk(idx)
        except ValueError:
            print("Please enter a valid integer.")
