import cv2
import numpy as np

def recognize_colors(hsv_pixel):
    """
    Classifies an HSV pixel value into Red, Magenta, or Deep Purple.
    """
    h, s, v = hsv_pixel[0], hsv_pixel[1], hsv_pixel[2]
    
    # 1. Check for Red (Hue wraps around 0 and 180 in OpenCV)
    if ((0 <= h <= 10) or (170 <= h <= 179)) and s > 100 and v > 50:
        return "Red", (0, 0, 255) # BGR format
        
    # 2. Check for Magenta (Bright purplish-pink, high hue, high brightness)
    elif 140 <= h <= 165 and s > 100 and v > 100:
        return "Magenta", (255, 0, 255)
        
    # 3. Check for Deep Purple (Darker purple shades: lower brightness value)
    elif 120 <= h <= 155 and s > 50 and v <= 100:
        return "Deep Purple", (128, 0, 128)
        
    else:
        return "Other Color", (200, 200, 200)

# Initialize Camera
cap = cv2.VideoCapture(0)

print("Press SPACEBAR to capture and recognize color, or 'q' to quit.")

while True:
    ret, frame = cap.read()
    if not ret:
        print("Failed to grab frame.")
        break

    # Draw a small targeting box in the center of the frame
    height, width, _ = frame.shape
    cx, cy = width // 2, height // 2
    cv2.rectangle(frame, (cx - 20, cy - 20), (cx + 20, cy + 20), (0, 255, 0), 2)
    cv2.putText(frame, "Align target here & press SPACE", (50, 50), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

    cv2.imshow("Camera - Color Recognizer", frame)

    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'): # Quit
        break
    elif key == ord(' '): # Spacebar pressed - Capture image
        # Convert captured frame to HSV color space
        hsv_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        
        # Get the average HSV value of the center targeting square (40x40 pixels)
        roi = hsv_frame[cy - 20:cy + 20, cx - 20:cx + 20]
        avg_hsv = np.mean(roi, axis=(0, 1))
        
        # Recognize color
        color_name, display_color = recognize_colors(avg_hsv)
        
        print(f"Captured! HSV values: H={avg_hsv[0]:.1f}, S={avg_hsv[1]:.1f}, V={avg_hsv[2]:.1f}")
        print(f"Detected Color: {color_name}\n")
        
        # Show result on a popup image window
        result_img = frame.copy()
        cv2.putText(result_img, f"Detected: {color_name}", (50, 100), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1.0, display_color, 3)
        cv2.imshow("Captured Result", result_img)
        cv2.waitKey(0) # Wait for any key to return to live camera feed

cap.release()
cv2.destroyAllWindows()