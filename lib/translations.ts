export type Language = 'zh' | 'en' | 'ja' | 'ko' | 'es' | 'ru';

export const translations = {
    zh: {
        title: "PDF 分页大师",
        subtitle: "上传您的 A3 PDF 文件并轻松分割页面。",
        upload: {
            dropHere: "将 PDF 拖放到此处",
            clickOrDrag: "点击上传或拖放文件",
            hint: "仅支持 PDF 文件 (最大 50MB)",
            alert: "请上传 PDF 文件。",
        },
        actions: {
            changeFile: "更换文件",
            cancel: "取消",
            processing: "处理中...",
            download: "下载文件",
        },
        items: {
            page: "第 {n} 页",
            splitAt: "分割位置 {n}%",
            loading: "加载中...",
            orig: "原始尺寸",
            left: "左侧",
            right: "右侧",
        },
        meta: {
            pageCount: "{n} 页",
        }
    },
    en: {
        title: "PDF Page Divider",
        subtitle: "Upload your A3 PDF and split pages easily.",
        upload: {
            dropHere: "Drop your PDF here",
            clickOrDrag: "Click to upload or drag and drop",
            hint: "PDF files only (max 50MB)",
            alert: "Please upload a PDF file.",
        },
        actions: {
            changeFile: "Change File",
            cancel: "Cancel",
            processing: "Processing...",
            download: "Download Output",
        },
        items: {
            page: "Page {n}",
            splitAt: "Split at {n}%",
            loading: "Loading...",
            orig: "Orig",
            left: "Left",
            right: "Right",
        },
        meta: {
            pageCount: "{n} Pages",
        }
    },
    ja: {
        title: "PDFページ分割",
        subtitle: "A3 PDFをアップロードして簡単にページを分割します。",
        upload: {
            dropHere: "PDFをここにドロップ",
            clickOrDrag: "クリックしてアップロード、またはドラッグ＆ドロップ",
            hint: "PDFファイルのみ (最大 50MB)",
            alert: "PDFファイルをアップロードしてください。",
        },
        actions: {
            changeFile: "ファイルを変更",
            cancel: "キャンセル",
            processing: "処理中...",
            download: "ダウンロード",
        },
        items: {
            page: "{n} ページ",
            splitAt: "分割位置 {n}%",
            loading: "読み込み中...",
            orig: "元",
            left: "左",
            right: "右",
        },
        meta: {
            pageCount: "{n} ページ",
        }
    },
    ko: {
        title: "PDF 페이지 분할기",
        subtitle: "A3 PDF를 업로드하고 페이지를 쉽게 분할하세요.",
        upload: {
            dropHere: "여기에 PDF 드롭",
            clickOrDrag: "클릭하여 업로드하거나 드래그 앤 드롭",
            hint: "PDF 파일만 가능 (최대 50MB)",
            alert: "PDF 파일을 업로드해주세요.",
        },
        actions: {
            changeFile: "파일 변경",
            cancel: "취소",
            processing: "처리 중...",
            download: "결과 다운로드",
        },
        items: {
            page: "{n} 페이지",
            splitAt: "분할 위치 {n}%",
            loading: "로딩 중...",
            orig: "원본",
            left: "왼쪽",
            right: "오른쪽",
        },
        meta: {
            pageCount: "{n} 페이지",
        }
    },
    es: {
        title: "Divisor de Páginas PDF",
        subtitle: "Sube tu PDF A3 y divide las páginas fácilmente.",
        upload: {
            dropHere: "Suelta tu PDF aquí",
            clickOrDrag: "Haz clic para subir o arrastra y suelta",
            hint: "Solo archivos PDF (máx. 50MB)",
            alert: "Por favor, sube un archivo PDF.",
        },
        actions: {
            changeFile: "Cambiar archivo",
            cancel: "Cancelar",
            processing: "Procesando...",
            download: "Descargar resultado",
        },
        items: {
            page: "Página {n}",
            splitAt: "Dividir en {n}%",
            loading: "Cargando...",
            orig: "Orig",
            left: "Izq",
            right: "Der",
        },
        meta: {
            pageCount: "{n} Páginas",
        }
    },
    ru: {
        title: "Разделитель Страниц PDF",
        subtitle: "Загрузите PDF формата A3 и легко разделите страницы.",
        upload: {
            dropHere: "Перетащите PDF сюда",
            clickOrDrag: "Нажмите для загрузки или перетащите",
            hint: "Только файлы PDF (макс. 50 МБ)",
            alert: "Пожалуйста, загрузите файл PDF.",
        },
        actions: {
            changeFile: "Изменить файл",
            cancel: "Отмена",
            processing: "Обработка...",
            download: "Скачать результат",
        },
        items: {
            page: "Страница {n}",
            splitAt: "Раздел {n}%",
            loading: "Загрузка...",
            orig: "Ориг",
            left: "Лев",
            right: "Прав",
        },
        meta: {
            pageCount: "{n} Стр.",
        }
    }
};
