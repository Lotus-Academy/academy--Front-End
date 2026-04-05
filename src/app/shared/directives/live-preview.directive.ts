import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import katex from 'katex';
import * as Prism from 'prismjs';

import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-rust';

@Directive({
    selector: '[appLivePreview]',
    standalone: true
})
export class LivePreviewDirective implements OnChanges {
    @Input() appLivePreview: string = '';

    constructor(private el: ElementRef) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['appLivePreview']) {
            this.renderContent();
        }
    }

    private renderContent(): void {
        if (!this.appLivePreview) {
            // Translated fallback text
            this.el.nativeElement.innerHTML = '<span class="text-slate-400 italic">Empty preview...</span>';
            return;
        }

        let html = this.escapeHtml(this.appLivePreview);

        // 1. Parse Markdown code blocks (```language ... ```)
        html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            const language = lang && Prism.languages[lang] ? lang : 'javascript';
            const unescapedCode = this.unescapeHtml(code);
            const highlighted = Prism.languages[language]
                ? Prism.highlight(unescapedCode, Prism.languages[language], language)
                : unescapedCode;
            return `<div class="my-4 rounded overflow-hidden shadow-sm border border-slate-700 dark:border-ds-border"><pre class="language-${language} !m-0 !p-4 !bg-[#1E1E1E]"><code class="language-${language}">${highlighted}</code></pre></div>`;
        });

        // 2. Parse Block Math ($$...$$)
        html = html.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
            try {
                return katex.renderToString(this.unescapeHtml(math), { displayMode: true, throwOnError: false });
            } catch (e) {
                // Translated error handling
                return `<span class="text-red-500">KaTeX Error: ${match}</span>`;
            }
        });

        // 3. Parse Inline Math ($...$)
        html = html.replace(/\$([^\n]*?)\$/g, (match, math) => {
            try {
                return katex.renderToString(this.unescapeHtml(math), { displayMode: false, throwOnError: false });
            } catch (e) {
                // Translated error handling
                return `<span class="text-red-500">KaTeX Error: ${match}</span>`;
            }
        });

        // 4. Parse Markdown Headers (H1, H2, H3, H4)
        // Using the multi-line option (m) to detect the start of each line
        html = html.replace(/^####\s+(.*$)/gm, '<h4 class="text-lg font-bold mt-4 mb-2 text-slate-800 dark:text-white">$1</h4>');
        html = html.replace(/^###\s+(.*$)/gm, '<h3 class="text-xl font-bold mt-5 mb-2 text-slate-900 dark:text-white">$1</h3>');
        html = html.replace(/^##\s+(.*$)/gm, '<h2 class="text-2xl font-bold mt-6 mb-3 text-slate-900 dark:text-white border-b border-slate-200 dark:border-ds-border pb-1">$1</h2>');
        html = html.replace(/^#\s+(.*$)/gm, '<h1 class="text-3xl font-cormorant font-bold mt-6 mb-4 text-lotus">$1</h1>');

        // 5. Parse Bold and Italic
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // 6. Parse Simple Bullet Lists (- item)
        html = html.replace(/^- \s+(.*$)/gm, '<li class="ml-4 list-disc marker:text-lotus">$1</li>');

        // Added Step: Group consecutive <li> tags into a <ul> block for proper HTML semantics
        html = html.replace(/(<li[^>]*>.*?<\/li>\n?)+/g, match => `<ul class="my-2">${match}</ul>`);

        // 7. Convert standard line breaks to <br> (only if not inside block tags)
        // Clean up line breaks around div, h1-h4, ul, li to avoid unwanted empty spaces
        html = html.replace(/<\/div>\n/g, '</div>');
        html = html.replace(/<\/h([1-4])>\n/g, '</h$1>');
        html = html.replace(/<\/ul>\n/g, '</ul>');
        html = html.replace(/<\/li>\n/g, '</li>');
        html = html.replace(/\n/g, '<br>');

        // Inject secure and formatted HTML
        this.el.nativeElement.innerHTML = html;
    }

    // Security utilities
    private escapeHtml(text: string): string {
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    private unescapeHtml(text: string): string {
        return text.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
    }
}