"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop, {
  type Crop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export default function ImageEditor() {
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState<Crop>();
  const [aspect, setAspect] = useState<number | undefined>(16 / 9);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [text, setText] = useState("");
  const [font, setFont] = useState("Arial");
  const [textColor, setTextColor] = useState("#000000");
  const [textX, setTextX] = useState(50);
  const [textY, setTextY] = useState(50);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener("load", () =>
        setImgSrc(reader.result?.toString() || "")
      );
      reader.readAsDataURL(e.target.files[0]);
    }
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  }

  const applyEdits = useCallback(() => {
    if (
      !imgRef.current ||
      !previewCanvasRef.current ||
      !crop ||
      crop.width === 0 ||
      crop.height === 0
    ) {
      return;
    }

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = crop.width;
    canvas.height = crop.height;

    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    // Add text overlay
    ctx.filter = "none";
    ctx.fillStyle = textColor;
    ctx.font = `20px ${font}`;
    ctx.textBaseline = "top";
    const textWidth = ctx.measureText(text).width;
    const x = (textX / 100) * crop.width - textWidth / 2;
    const y = (textY / 100) * crop.height;
    ctx.fillText(text, x, y);
  }, [
    crop,
    brightness,
    contrast,
    saturation,
    text,
    font,
    textColor,
    textX,
    textY,
  ]);

  useEffect(() => {
    applyEdits();
  }, [applyEdits]);

  const downloadImage = () => {
    if (!previewCanvasRef.current) return;

    previewCanvasRef.current.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = "edited-image.jpg";
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }, "image/jpeg");
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Image Editor</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-4">Upload Image</h2>
          <input
            type="file"
            accept="image/*"
            onChange={onSelectFile}
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-violet-50 file:text-violet-700
              hover:file:bg-violet-100"
          />
          {Boolean(imgSrc) && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Original Image</h3>
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCrop(c)}
                aspect={aspect}
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={imgSrc}
                  onLoad={onImageLoad}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "400px",
                    objectFit: "contain",
                  }}
                />
              </ReactCrop>
            </div>
          )}
        </Card>
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-4">Preview</h2>
          <canvas
            ref={previewCanvasRef}
            style={{
              border: "1px solid black",
              objectFit: "contain",
              width: "100%",
              height: "auto",
              maxHeight: "400px",
            }}
          />
          <Button
            onClick={downloadImage}
            disabled={!imgSrc}
            className="mt-4 w-full"
          >
            Download Edited Image
          </Button>
        </Card>
      </div>
      {Boolean(imgSrc) && (
        <Card className="mt-6 p-4">
          <Tabs defaultValue="adjust" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="adjust">Adjust</TabsTrigger>
              <TabsTrigger value="text">Text</TabsTrigger>
              <TabsTrigger value="position">Position</TabsTrigger>
            </TabsList>
            <TabsContent value="adjust">
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="brightness-slider">Brightness</Label>
                  <Slider
                    id="brightness-slider"
                    min={0}
                    max={200}
                    step={1}
                    value={[brightness]}
                    onValueChange={(value) => setBrightness(value[0])}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contrast-slider">Contrast</Label>
                  <Slider
                    id="contrast-slider"
                    min={0}
                    max={200}
                    step={1}
                    value={[contrast]}
                    onValueChange={(value) => setContrast(value[0])}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="saturation-slider">Saturation</Label>
                  <Slider
                    id="saturation-slider"
                    min={0}
                    max={200}
                    step={1}
                    value={[saturation]}
                    onValueChange={(value) => setSaturation(value[0])}
                  />
                </div>
              </CardContent>
            </TabsContent>
            <TabsContent value="text">
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="text-input">Text Overlay</Label>
                  <Input
                    id="text-input"
                    type="text"
                    placeholder="Enter text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="font-select">Font</Label>
                  <Select value={font} onValueChange={setFont}>
                    <SelectTrigger id="font-select">
                      <SelectValue placeholder="Select font" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Verdana">Verdana</SelectItem>
                      <SelectItem value="Times New Roman">
                        Times New Roman
                      </SelectItem>
                      <SelectItem value="Courier">Courier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color-input">Text Color</Label>
                  <Input
                    id="color-input"
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                  />
                </div>
              </CardContent>
            </TabsContent>
            <TabsContent value="position">
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="text-x-slider">
                    Text Horizontal Position
                  </Label>
                  <Slider
                    id="text-x-slider"
                    min={0}
                    max={100}
                    step={1}
                    value={[textX]}
                    onValueChange={(value) => setTextX(value[0])}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="text-y-slider">Text Vertical Position</Label>
                  <Slider
                    id="text-y-slider"
                    min={0}
                    max={100}
                    step={1}
                    value={[textY]}
                    onValueChange={(value) => setTextY(value[0])}
                  />
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      )}
    </div>
  );
}
