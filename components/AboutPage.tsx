import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { WebView } from "react-native-webview";

interface AboutPageProps {
  onBack: () => void;
}

export function AboutPage({ onBack }: AboutPageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 将 PDF 上传到 Supabase Storage 后，把下面的 URL 替换成实际的 PDF URL
  // 例如: https://your-project.supabase.co/storage/v1/object/public/public-files/privacy.pdf
  const PDF_URL =
    "https://urcnzjpekxsgruqcajmq.supabase.co/storage/v1/object/public/files/privacy.pdf";

  // 使用 Google Docs Viewer 来渲染 PDF（更稳定的方案）
  const googleDocsViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
    PDF_URL
  )}&embedded=true`;

  // 创建一个使用 PDF.js 的 HTML 来更好地控制 PDF 显示
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          html, body {
            width: 100%;
            height: 100%;
            overflow: auto;
            background-color: #f5f5f5;
            -webkit-overflow-scrolling: touch;
          }
          #pdf-container {
            width: 100%;
            padding: 10px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
          }
          canvas {
            display: block;
            width: 100% !important;
            height: auto !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            background: white;
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
          }
          .loading {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #666;
            font-size: 14px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
        </style>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
      </head>
      <body>
        <div class="loading" id="loading">加载中...</div>
        <div id="pdf-container"></div>
        <script>
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          
          const loadingDiv = document.getElementById('loading');
          const container = document.getElementById('pdf-container');
          
          fetch('${PDF_URL}')
            .then(response => response.arrayBuffer())
            .then(data => {
              const loadingTask = pdfjsLib.getDocument({data: data});
              
              loadingTask.promise.then(function(pdf) {
                // 移除 loading
                loadingDiv.remove();
                
                // 获取容器宽度（减去 padding）
                const containerWidth = window.innerWidth - 20;
                // 使用设备像素比来提高清晰度
                const pixelRatio = window.devicePixelRatio || 2;
                
                // 渲染所有页面
                const renderPromises = [];
                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                  renderPromises.push(
                    pdf.getPage(pageNum).then(function(page) {
                      // 计算合适的缩放比例，使页面宽度适配屏幕
                      const viewport = page.getViewport({scale: 1.0});
                      const scale = (containerWidth / viewport.width) * pixelRatio;
                      const scaledViewport = page.getViewport({scale: scale});
                      
                      const canvas = document.createElement('canvas');
                      const context = canvas.getContext('2d');
                      
                      // 设置 canvas 的实际尺寸（高分辨率）
                      canvas.height = scaledViewport.height;
                      canvas.width = scaledViewport.width;
                      
                      // 设置 canvas 的显示尺寸
                      canvas.style.width = containerWidth + 'px';
                      canvas.style.height = (scaledViewport.height / pixelRatio) + 'px';
                      
                      container.appendChild(canvas);
                      
                      const renderContext = {
                        canvasContext: context,
                        viewport: scaledViewport
                      };
                      
                      return page.render(renderContext).promise;
                    })
                  );
                }
                
                return Promise.all(renderPromises);
              }).catch(function(error) {
                loadingDiv.textContent = '加载 PDF 失败: ' + error.message;
                loadingDiv.style.color = '#EF4444';
              });
            })
            .catch(function(error) {
              loadingDiv.textContent = '网络错误: ' + error.message;
              loadingDiv.style.color = '#EF4444';
            });
        </script>
      </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
            <ArrowLeft size={20} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>About</Text>
        </View>
      </View>

      {/* PDF Viewer */}
      <View style={styles.pdfContainer}>
        <WebView
          source={{ html: htmlContent }}
          style={styles.webview}
          originWhitelist={["*"]}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scalesPageToFit={false}
          showsHorizontalScrollIndicator={false}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color="#F97316" />
              <Text style={styles.loadingText}>加载 PDF 中...</Text>
            </View>
          )}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error("WebView error: ", nativeEvent);
            setError("加载失败，请检查网络连接");
          }}
          onLoadEnd={() => setLoading(false)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "#F8FAFC",
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    marginLeft: 12,
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  webview: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },
  errorText: {
    fontSize: 14,
    color: "#EF4444",
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
