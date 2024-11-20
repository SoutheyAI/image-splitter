#!/bin/bash

# 图片路径
IMAGE_PATH="../src/assets/hero.png"
TARGET_WIDTH=520
TARGET_HEIGHT=424

# 检查图片是否存在
if [ ! -f "$IMAGE_PATH" ]; then
    echo "Error: hero.png not found at $IMAGE_PATH"
    exit 1
fi

# 获取当前图片尺寸
CURRENT_SIZE=$(sips -g pixelWidth -g pixelHeight "$IMAGE_PATH" | tail -n 2)
CURRENT_WIDTH=$(echo "$CURRENT_SIZE" | head -n 1 | awk '{print $2}')
CURRENT_HEIGHT=$(echo "$CURRENT_SIZE" | tail -n 1 | awk '{print $2}')

# 如果尺寸已经正确，则不进行修改
if [ "$CURRENT_WIDTH" -eq "$TARGET_WIDTH" ] && [ "$CURRENT_HEIGHT" -eq "$TARGET_HEIGHT" ]; then
    echo "Image already has the correct dimensions ($TARGET_WIDTH x $TARGET_HEIGHT)"
    exit 0
fi

# 调整图片尺寸
echo "Resizing image from ${CURRENT_WIDTH}x${CURRENT_HEIGHT} to ${TARGET_WIDTH}x${TARGET_HEIGHT}"
sips --resampleHeightWidth $TARGET_HEIGHT $TARGET_WIDTH "$IMAGE_PATH"

echo "Image has been resized successfully"
