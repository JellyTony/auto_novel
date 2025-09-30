package export

import (
	"archive/zip"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"backend/internal/pkg/models"
)

// EPUBBuilder EPUB构建器
type EPUBBuilder struct {
	Title       string
	Description string
	Language    string
	Chapters    []*models.Chapter
	Options     *models.ExportOptions
}

// Build 构建EPUB文件
func (e *EPUBBuilder) Build(outputPath string) (int64, error) {
	// 创建临时目录
	tempDir := filepath.Join(os.TempDir(), fmt.Sprintf("epub_%d", time.Now().UnixNano()))
	defer os.RemoveAll(tempDir)

	// 创建EPUB目录结构
	if err := e.createEPUBStructure(tempDir); err != nil {
		return 0, fmt.Errorf("failed to create EPUB structure: %w", err)
	}

	// 创建ZIP文件
	return e.createZipFile(tempDir, outputPath)
}

// createEPUBStructure 创建EPUB目录结构
func (e *EPUBBuilder) createEPUBStructure(baseDir string) error {
	// 创建必要的目录
	dirs := []string{
		"META-INF",
		"OEBPS",
		"OEBPS/Text",
		"OEBPS/Styles",
	}

	for _, dir := range dirs {
		if err := os.MkdirAll(filepath.Join(baseDir, dir), 0755); err != nil {
			return err
		}
	}

	// 创建mimetype文件
	if err := e.createMimeType(baseDir); err != nil {
		return err
	}

	// 创建container.xml
	if err := e.createContainer(baseDir); err != nil {
		return err
	}

	// 创建content.opf
	if err := e.createContentOPF(baseDir); err != nil {
		return err
	}

	// 创建toc.ncx
	if err := e.createTocNCX(baseDir); err != nil {
		return err
	}

	// 创建CSS样式
	if err := e.createCSS(baseDir); err != nil {
		return err
	}

	// 创建章节HTML文件
	if err := e.createChapterFiles(baseDir); err != nil {
		return err
	}

	return nil
}

// createMimeType 创建mimetype文件
func (e *EPUBBuilder) createMimeType(baseDir string) error {
	content := "application/epub+zip"
	return os.WriteFile(filepath.Join(baseDir, "mimetype"), []byte(content), 0644)
}

// createContainer 创建container.xml
func (e *EPUBBuilder) createContainer(baseDir string) error {
	content := `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
    <rootfiles>
        <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
    </rootfiles>
</container>`
	
	return os.WriteFile(filepath.Join(baseDir, "META-INF", "container.xml"), []byte(content), 0644)
}

// createContentOPF 创建content.opf
func (e *EPUBBuilder) createContentOPF(baseDir string) error {
	var manifest strings.Builder
	var spine strings.Builder
	
	// 添加CSS文件到manifest
	manifest.WriteString(`    <item id="css" href="Styles/style.css" media-type="text/css"/>` + "\n")
	
	// 添加章节文件到manifest和spine
	for i := range e.Chapters {
		chapterID := fmt.Sprintf("chapter%d", i+1)
		chapterFile := fmt.Sprintf("Text/chapter%d.xhtml", i+1)
		
		manifest.WriteString(fmt.Sprintf(`    <item id="%s" href="%s" media-type="application/xhtml+xml"/>`, chapterID, chapterFile) + "\n")
		spine.WriteString(fmt.Sprintf(`    <itemref idref="%s"/>`, chapterID) + "\n")
	}

	content := fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8"?>
<package version="3.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:identifier id="BookId">%s</dc:identifier>
        <dc:title>%s</dc:title>
        <dc:language>%s</dc:language>
        <dc:description>%s</dc:description>
        <meta property="dcterms:modified">%s</meta>
    </metadata>
    <manifest>
%s    </manifest>
    <spine>
%s    </spine>
</package>`, 
		fmt.Sprintf("novel_%d", time.Now().Unix()),
		e.Title,
		e.Language,
		e.Description,
		time.Now().Format("2006-01-02T15:04:05Z"),
		manifest.String(),
		spine.String())

	return os.WriteFile(filepath.Join(baseDir, "OEBPS", "content.opf"), []byte(content), 0644)
}

// createTocNCX 创建toc.ncx
func (e *EPUBBuilder) createTocNCX(baseDir string) error {
	var navPoints strings.Builder
	
	for i := range e.Chapters {
		navPoints.WriteString(fmt.Sprintf(`    <navPoint id="navpoint-%d" playOrder="%d">
        <navLabel>
            <text>第%d章 %s</text>
        </navLabel>
        <content src="Text/chapter%d.xhtml"/>
    </navPoint>
`, i+1, i+1, i+1, e.Chapters[i].Title, i+1))
	}

	content := fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8"?>
<ncx version="2005-1" xmlns="http://www.daisy.org/z3986/2005/ncx/">
    <head>
        <meta name="dtb:uid" content="novel_%d"/>
        <meta name="dtb:depth" content="1"/>
        <meta name="dtb:totalPageCount" content="0"/>
        <meta name="dtb:maxPageNumber" content="0"/>
    </head>
    <docTitle>
        <text>%s</text>
    </docTitle>
    <navMap>
%s    </navMap>
</ncx>`,
		time.Now().Unix(),
		e.Title,
		navPoints.String())

	return os.WriteFile(filepath.Join(baseDir, "OEBPS", "toc.ncx"), []byte(content), 0644)
}

// createCSS 创建CSS样式文件
func (e *EPUBBuilder) createCSS(baseDir string) error {
	fontFamily := "serif"
	fontSize := "16px"
	
	if e.Options != nil {
		if e.Options.FontFamily != "" {
			fontFamily = e.Options.FontFamily
		}
		if e.Options.FontSize > 0 {
			fontSize = fmt.Sprintf("%dpx", e.Options.FontSize)
		}
	}

	content := fmt.Sprintf(`body {
    font-family: %s;
    font-size: %s;
    line-height: 1.6;
    margin: 1em;
    text-align: justify;
}

h1 {
    text-align: center;
    font-size: 1.5em;
    margin: 2em 0 1em 0;
    page-break-before: always;
}

p {
    margin: 0.5em 0;
    text-indent: 2em;
}

.chapter-title {
    text-align: center;
    font-size: 1.3em;
    font-weight: bold;
    margin: 2em 0 1em 0;
}`, fontFamily, fontSize)

	return os.WriteFile(filepath.Join(baseDir, "OEBPS", "Styles", "style.css"), []byte(content), 0644)
}

// createChapterFiles 创建章节HTML文件
func (e *EPUBBuilder) createChapterFiles(baseDir string) error {
	for i, chapter := range e.Chapters {
		content := e.getChapterContent(chapter)
		
		html := fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>第%d章 %s</title>
    <link rel="stylesheet" type="text/css" href="../Styles/style.css"/>
</head>
<body>
    <h1 class="chapter-title">第%d章 %s</h1>
    %s
</body>
</html>`, i+1, chapter.Title, i+1, chapter.Title, e.formatContent(content))

		fileName := fmt.Sprintf("chapter%d.xhtml", i+1)
		filePath := filepath.Join(baseDir, "OEBPS", "Text", fileName)
		
		if err := os.WriteFile(filePath, []byte(html), 0644); err != nil {
			return err
		}
	}
	
	return nil
}

// getChapterContent 获取章节内容
func (e *EPUBBuilder) getChapterContent(chapter *models.Chapter) string {
	// 优先使用润色后的内容，如果没有则使用原始内容
	if chapter.PolishedContent != "" {
		return chapter.PolishedContent
	}
	return chapter.RawContent
}

// formatContent 格式化内容为HTML段落
func (e *EPUBBuilder) formatContent(content string) string {
	paragraphs := strings.Split(content, "\n")
	var formatted strings.Builder
	
	for _, paragraph := range paragraphs {
		paragraph = strings.TrimSpace(paragraph)
		if paragraph != "" {
			formatted.WriteString(fmt.Sprintf("    <p>%s</p>\n", paragraph))
		}
	}
	
	return formatted.String()
}

// createZipFile 创建ZIP文件
func (e *EPUBBuilder) createZipFile(sourceDir, outputPath string) (int64, error) {
	// 确保输出目录存在
	if err := os.MkdirAll(filepath.Dir(outputPath), 0755); err != nil {
		return 0, err
	}

	// 创建ZIP文件
	zipFile, err := os.Create(outputPath)
	if err != nil {
		return 0, err
	}
	defer zipFile.Close()

	zipWriter := zip.NewWriter(zipFile)
	defer zipWriter.Close()

	// 遍历源目录并添加文件到ZIP
	err = filepath.Walk(sourceDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// 跳过目录
		if info.IsDir() {
			return nil
		}

		// 计算相对路径
		relPath, err := filepath.Rel(sourceDir, path)
		if err != nil {
			return err
		}

		// 读取文件内容
		fileContent, err := os.ReadFile(path)
		if err != nil {
			return err
		}

		// 创建ZIP文件条目
		writer, err := zipWriter.Create(relPath)
		if err != nil {
			return err
		}

		// 写入文件内容
		_, err = writer.Write(fileContent)
		return err
	})

	if err != nil {
		return 0, err
	}

	// 获取文件大小
	stat, err := zipFile.Stat()
	if err != nil {
		return 0, err
	}

	return stat.Size(), nil
}