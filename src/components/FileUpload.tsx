import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { StorageService } from '@/lib/backend-services';
import { Upload, Download, File, X, Image, FileText, FileArchive, CheckCircle, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onUploadComplete: (fileUrl: string) => void;
  onFileRemove?: () => void;
  existingFileUrl?: string;
  bucket?: 'alert-files' | 'report-exports';
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  onFileRemove,
  existingFileUrl,
  bucket = 'alert-files',
  maxSize = 50,
  acceptedTypes = ['.pcap', '.pcapng', '.txt', '.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
  className = '',
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className="h-4 w-4" />;
      case 'pdf':
      case 'doc':
      case 'docx':
      case 'txt':
        return <FileText className="h-4 w-4" />;
      case 'pcap':
      case 'pcapng':
        return <FileArchive className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const getFileType = (fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'image';
      case 'pdf':
      case 'doc':
      case 'docx':
      case 'txt':
        return 'document';
      case 'pcap':
      case 'pcapng':
        return 'network';
      default:
        return 'file';
    }
  };

  const validateFile = (selectedFile: File): boolean => {
    // Check file size
    if (selectedFile.size > maxSize * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: `File size must be less than ${maxSize}MB`,
      });
      return false;
    }

    // Check file type
    const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));
    if (!acceptedTypes.some(type => fileExtension.endsWith(type.substring(1)))) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: `Please upload a valid file type: ${acceptedTypes.join(', ')}`,
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = (selectedFile: File) => {
    if (validateFile(selectedFile)) {
      setFile(selectedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      let fileUrl: string;
      
      if (bucket === 'alert-files') {
        fileUrl = await StorageService.uploadAlertFile(file);
      } else {
        fileUrl = await StorageService.uploadReportFile(file);
      }

      onUploadComplete(fileUrl);
      setFile(null);
      
      toast({
        title: "File uploaded",
        description: "File uploaded successfully",
      });
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Failed to upload file",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const downloadUrl = await StorageService.getSignedUrl(fileUrl);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      a.click();
      
      toast({
        title: "Download started",
        description: "File download has started",
      });
    } catch (error: any) {
      console.error('Download failed:', error);
      toast({
        variant: "destructive",
        title: "Download failed",
        description: error.message || "Failed to download file",
      });
    }
  };

  const handleRemove = () => {
    setFile(null);
    if (onFileRemove) {
      onFileRemove();
    }
  };

  const getFileNameFromUrl = (url: string) => {
    try {
      const urlParts = url.split('/');
      return urlParts[urlParts.length - 1] || 'Unknown file';
    } catch {
      return 'Unknown file';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
          <div>
            <Label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-primary hover:underline">Click to upload</span>
              <span className="text-muted-foreground"> or drag and drop</span>
            </Label>
            <Input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              accept={acceptedTypes.join(',')}
              className="hidden"
              disabled={uploading}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {acceptedTypes.join(', ')} (max {maxSize}MB)
          </p>
        </div>
      </div>

      {/* Selected File */}
      {file && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getFileIcon(file.name)}
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {getFileType(file.name)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemove}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing File */}
      {existingFileUrl && !file && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">{getFileNameFromUrl(existingFileUrl)}</p>
                  <p className="text-sm text-muted-foreground">File uploaded</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(existingFileUrl, getFileNameFromUrl(existingFileUrl))}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                {onFileRemove && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemove}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Uploading file...</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload; 