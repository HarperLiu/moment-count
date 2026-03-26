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
import { useThemeContext } from "../styles/ThemeContext";
import { useLanguageContext } from "../styles/LanguageContext";

interface AboutPageProps {
  onBack: () => void;
}

export function AboutPage({ onBack }: AboutPageProps) {
  const { theme } = useThemeContext();
  const { t } = useLanguageContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const PDF_URL =
    "https://urcnzjpekxsgruqcajmq.supabase.co/storage/v1/object/public/files/privacy.pdf";

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
            background-color: ${theme.colorBackground};
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
            background: ${theme.colorCard};
            border-radius: 8px;
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
            color: ${theme.colorMutedForeground};
            font-size: 14px;
            background: ${theme.colorCard};
            border-radius: 8px;
          }
        </style>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
      </head>
      <body>
        <div class="loading" id="loading">Loading...</div>
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
                loadingDiv.remove();

                const containerWidth = window.innerWidth - 20;
                const pixelRatio = window.devicePixelRatio || 2;

                const renderPromises = [];
                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                  renderPromises.push(
                    pdf.getPage(pageNum).then(function(page) {
                      const viewport = page.getViewport({scale: 1.0});
                      const scale = (containerWidth / viewport.width) * pixelRatio;
                      const scaledViewport = page.getViewport({scale: scale});

                      const canvas = document.createElement('canvas');
                      const context = canvas.getContext('2d');

                      canvas.height = scaledViewport.height;
                      canvas.width = scaledViewport.width;

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
                loadingDiv.textContent = 'Failed to load PDF: ' + error.message;
                loadingDiv.style.color = '#E05C6E';
              });
            })
            .catch(function(error) {
              loadingDiv.textContent = 'Network error: ' + error.message;
              loadingDiv.style.color = '#E05C6E';
            });
        </script>
      </body>
    </html>
  `;

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.colorBackground }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: theme.colorBorder },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
            <ArrowLeft size={22} color={theme.colorForeground} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: theme.colorForeground }]}>
            {t("about.title")}
          </Text>
          <View style={styles.iconBtn} />
        </View>
      </View>

      {/* PDF Viewer */}
      <View style={[styles.pdfContainer, { backgroundColor: theme.colorBackground }]}>
        <WebView
          source={{ html: htmlContent }}
          style={[styles.webview, { backgroundColor: theme.colorBackground }]}
          originWhitelist={["*"]}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scalesPageToFit={false}
          showsHorizontalScrollIndicator={false}
          startInLoadingState={true}
          renderLoading={() => (
            <View
              style={[
                styles.centerContent,
                { backgroundColor: theme.colorBackground },
              ]}
            >
              <ActivityIndicator size="large" color={theme.colorPrimary} />
              <Text
                style={[
                  styles.loadingText,
                  { color: theme.colorMutedForeground },
                ]}
              >
                {t("common.loading")}
              </Text>
            </View>
          )}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error("WebView error: ", nativeEvent);
            setError("Failed to load content");
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
  },
  header: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  pdfContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
});
