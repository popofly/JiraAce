// 创建一个函数来等待元素出现
function waitForElement(selector, maxAttempts = 10) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        
        const checkElement = () => {
            attempts++;
            const element = document.querySelector(selector);
            
            if (element) {
                resolve(element);
                return;
            }
            
            if (attempts >= maxAttempts) {
                reject(`Element ${selector} not found after ${maxAttempts} attempts`);
                return;
            }
            
            setTimeout(checkElement, 1000);
        };
        
        checkElement();
    });
}

// 检查是否是Jira issue页面
function isJiraIssuePage() {
    const isJiraUrl = window.location.href.includes('/browse/');
    const hasTitle = !!document.querySelector('h1[data-test-id="issue.views.issue-base.foundation.summary.heading"]');
    console.log('URL检查:', isJiraUrl, '标题检查:', hasTitle, 'URL:', window.location.href);
    return isJiraUrl;  // 暂时只检查URL
}

// 创建警告元素的通用
function createWarningElement(text, fieldId) {
    const warningElement = document.createElement('div');
    warningElement.id = text.toLowerCase().replace(/\s+/g, '-');
    warningElement.style.cssText = `
        color: #DE350B;
        font-weight: 500;
        font-size: 13px;
        margin: 8px 0;
        padding: 6px 12px;
        background-color: #FFEBE6;
        border-radius: 3px;
        border: 1px solid #FFBDAD;
        display: inline-flex;
        align-items: center;
        visibility: visible !important;
        position: relative;
        z-index: 1000;
        width: fit-content;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        user-select: none;
        gap: 6px;
    `;

    // 创建图标元素
    const iconSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    iconSvg.setAttribute("width", "14");
    iconSvg.setAttribute("height", "14");
    iconSvg.setAttribute("viewBox", "0 0 24 24");
    iconSvg.setAttribute("fill", "none");
    iconSvg.style.cssText = `
        min-width: 14px;
        min-height: 14px;
    `;

    // 设置感叹号图标路径
    iconSvg.innerHTML = `
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" 
              stroke="#DE350B" 
              stroke-width="2" 
              stroke-linecap="round" 
              stroke-linejoin="round"/>
        <path d="M12 8V12" 
              stroke="#DE350B" 
              stroke-width="2" 
              stroke-linecap="round" 
              stroke-linejoin="round"/>
        <path d="M12 16H12.01" 
              stroke="#DE350B" 
              stroke-width="2" 
              stroke-linecap="round" 
              stroke-linejoin="round"/>
    `;

    // 创建文本元素
    const textSpan = document.createElement('span');
    textSpan.textContent = text;

    // 将图标和文本添加到警告元素中
    warningElement.appendChild(iconSvg);
    warningElement.appendChild(textSpan);

    // 添加悬停效果
    warningElement.addEventListener('mouseover', () => {
        warningElement.style.backgroundColor = '#FFD2CC';
        warningElement.style.borderColor = '#FF8F73';
        warningElement.style.transform = 'translateY(-1px)';
        warningElement.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    });

    warningElement.addEventListener('mouseout', () => {
        warningElement.style.backgroundColor = '#FFEBE6';
        warningElement.style.borderColor = '#FFBDAD';
        warningElement.style.transform = 'translateY(0)';
        warningElement.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
    });

    // 添加点击事件处理
    warningElement.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        console.log(`${text} clicked`);
        
        // 查找Edit按钮
        const editButton = 
            document.querySelector('#edit-issue') || 
            document.querySelector('button[id="edit-issue"]') || 
            document.querySelector('button[aria-label="Edit issue"]');
        
        console.log('Found edit button:', editButton);
        
        if (editButton) {
            console.log('Clicking edit button');
            editButton.click();
            
            // 等待编辑界面加载完成并滚动到相应字段
            try {
                const field = await waitForElement(`#${fieldId}`, 20);
                console.log(`${text} field found:`, field);
                field.scrollIntoView({ behavior: 'smooth', block: 'center' });
                field.focus();
                
                // 如果是Epic Link字段，尝试打开下拉菜单
                if (fieldId === 'customfield_11450-field') {
                    const dropdownButton = field.querySelector('button[aria-haspopup="listbox"]');
                    if (dropdownButton) {
                        dropdownButton.click();
                    }
                }
            } catch (error) {
                console.error(`Error finding ${text} field:`, error);
            }
        }
    });

    return warningElement;
}

// 创建一个容器来放置所有警告
function createWarningsContainer() {
    const container = document.createElement('div');
    container.id = 'warnings-container';
    container.style.cssText = `
        display: flex;
        gap: 8px;
        margin-top: 4px;
    `;
    return container;
}

// 修改检查函数
async function checkEpicLink() {
    try {
        console.log('开始检查...');
        
        // 先检查URL
        if (!window.location.href.includes('/browse/')) {
            console.log('不是Jira ticket页面，跳过检查');
            return;
        }

        console.log('开始检查Epic Link和Story Points...');
        
        // 等待页面加载完成
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 获取ticket类型
        const typeElement = document.getElementById('type-val');
        const ticketType = typeElement ? typeElement.textContent.trim() : '';
        console.log('Ticket类型:', ticketType);
        
        // 定义需要检查的ticket类型
        const typesNeedingCheck = ['Technical task', 'Improvement', 'User Story', 'QA Task'];
        const needsCheck = typesNeedingCheck.includes(ticketType);
        
        // 如果不是需要检查的类型，直接返回
        if (!needsCheck) {
            console.log('当前ticket类型不需要检查Epic Link和Story Points');
            // 移除已存在的警告
            const warningsContainer = document.getElementById('warnings-container');
            if (warningsContainer) {
                warningsContainer.remove();
            }
            return;
        }
        
        // 定义需要Story Points的ticket类型（不包括QA Task）
        const typesNeedingStoryPoints = ['Technical task', 'Improvement', 'User Story'];
        const needsStoryPoints = typesNeedingStoryPoints.includes(ticketType);
        
        // 获取所有字段列表项
        const fields = document.querySelectorAll('li.item');
        console.log('找到字段数量:', fields.length);
        
        // 查找Epic Link字段
        let epicLinkField = null;
        fields.forEach(field => {
            const label = field.querySelector('strong.name');
            if (label && label.textContent.trim() === 'Epic Link') {
                epicLinkField = field;
            }
        });
        
        // 只在特定类型的ticket下才检查Story Points字段
        const storyPointsField = needsStoryPoints ? document.getElementById('rowForcustomfield_10422') : null;
        console.log('Story Points字段:', storyPointsField);
        
        // 获取标题元素
        const titleElement = document.querySelector('#summary-val');
        
        if (titleElement) {
            // 获取或创建警告容器
            let warningsContainer = document.getElementById('warnings-container');
            if (!warningsContainer) {
                warningsContainer = createWarningsContainer();
                titleElement.parentNode.insertBefore(warningsContainer, titleElement.nextSibling);
            }

            // 检查并显示Epic Link警告
            const epicLinkElement = document.querySelector('#customfield_11450-val');
            console.log('Epic Link元素:', epicLinkElement);

            let hasEpicLink = false;
            if (epicLinkElement) {
                const epicLinkValue = epicLinkElement.querySelector('a.aui-label');
                if (epicLinkValue) {
                    const linkText = epicLinkValue.textContent.trim();
                    hasEpicLink = linkText && linkText !== '';
                    console.log('Epic Link值:', linkText, '是否有效:', hasEpicLink);
                }
            }

            // 修改判断条件
            if (!hasEpicLink) {
                console.log('Epic Link为空或无效，准备添加警告...');
                if (!document.getElementById('no-epic-link')) {
                    const epicWarning = createWarningElement('NO EPIC LINK', 'customfield_11450-field');
                    warningsContainer.appendChild(epicWarning);
                }
            } else {
                console.log('找到有效的Epic Link');
                const existingEpicWarning = document.getElementById('no-epic-link');
                if (existingEpicWarning) {
                    existingEpicWarning.remove();
                }
            }

            // 只在需要Story Points的ticket类型下显示Story Points警告
            if (needsStoryPoints) {
                if (!storyPointsField || !storyPointsField.textContent.trim()) {
                    if (!document.getElementById('no-story-point')) {
                        const storyPointWarning = createWarningElement('NO STORY POINT', 'customfield_10422');
                        warningsContainer.appendChild(storyPointWarning);
                    }
                } else {
                    const existingStoryPointWarning = document.getElementById('no-story-point');
                    if (existingStoryPointWarning) {
                        existingStoryPointWarning.remove();
                    }
                }
            } else {
                // 如果不需要Story Points，移除已存在的警告
                const existingStoryPointWarning = document.getElementById('no-story-point');
                if (existingStoryPointWarning) {
                    existingStoryPointWarning.remove();
                }
            }

            // 如果没有警告，移除容器
            if (!warningsContainer.hasChildNodes()) {
                warningsContainer.remove();
            }
        }
    } catch (error) {
        console.log('检查过程中出错:', error);
    }
}

// 创建防抖动函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 使用防抖动的检查函数
const debouncedCheck = debounce(checkEpicLink, 1000);

// 创建显示ticket key的浮动元素
function createTicketKeyDisplay(ticketKey) {
    const keyDisplay = document.createElement('div');
    keyDisplay.id = 'floating-ticket-key';
    keyDisplay.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: #0052CC;
        color: white;
        padding: 8px 12px;
        border-radius: 3px;
        font-size: 13px;
        font-weight: 500;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s ease;
    `;

    // 创建链接元素
    const link = document.createElement('a');
    link.href = `/browse/${ticketKey}`;
    link.textContent = ticketKey;
    link.target = '_blank';  // 在新窗口打开
    link.style.cssText = `
        color: white;
        text-decoration: none;
        cursor: pointer;
    `;

    // 创建复制按钮
    const copyButton = document.createElement('button');
    copyButton.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 9H11C9.89543 9 9 9.89543 9 11V20C9 21.1046 9.89543 22 11 22H20C21.1046 22 22 21.1046 22 20V11C22 9.89543 21.1046 9 20 9Z" 
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M5 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H13C13.5304 2 14.0391 2.21071 14.4142 2.58579C14.7893 2.96086 15 3.46957 15 4V5" 
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;
    copyButton.style.cssText = `
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.8;
        transition: opacity 0.2s ease;
    `;

    // 添加复制按钮的悬停效果
    copyButton.addEventListener('mouseover', () => {
        copyButton.style.opacity = '1';
    });

    copyButton.addEventListener('mouseout', () => {
        copyButton.style.opacity = '0.8';
    });

    // 添加复制功能
    copyButton.addEventListener('click', async () => {
        // 构建富文本内容
        const fullUrl = `${window.location.origin}/browse/${ticketKey}`;
        
        try {
            // 创建包含富文本和HTML的剪贴板数据
            const clipboardData = new ClipboardItem({
                'text/plain': new Blob([ticketKey], { type: 'text/plain' }),
                'text/html': new Blob([`<a href="${fullUrl}" target="_blank">${ticketKey}</a>`], { type: 'text/html' })
            });
            
            // 使用新的clipboard API复制富文本
            await navigator.clipboard.write([clipboardData]);

            // 显示复制成功的临时提示
            const originalHTML = copyButton.innerHTML;
            copyButton.innerHTML = '✓';
            setTimeout(() => {
                copyButton.innerHTML = originalHTML;
            }, 1000);
        } catch (error) {
            console.error('复制失败:', error);
        }
    });

    // 添加整体容器的悬停效果
    keyDisplay.addEventListener('mouseover', () => {
        keyDisplay.style.backgroundColor = '#0065FF';
        keyDisplay.style.transform = 'translateY(-1px)';
        keyDisplay.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
    });

    keyDisplay.addEventListener('mouseout', () => {
        keyDisplay.style.backgroundColor = '#0052CC';
        keyDisplay.style.transform = 'translateY(0)';
        keyDisplay.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    });

    // 将链接和复制按钮添加到容器中
    keyDisplay.appendChild(link);
    keyDisplay.appendChild(copyButton);

    return keyDisplay;
}

// 检查和显示ticket key的函数
function checkAndDisplayTicketKey() {
    try {
        // 检查是否是ticket页面
        if (!window.location.href.includes('/browse/')) {
            const existingDisplay = document.getElementById('floating-ticket-key');
            if (existingDisplay) {
                existingDisplay.remove();
            }
            return;
        }

        // 从URL中提取ticket key
        const match = window.location.pathname.match(/\/browse\/([^/]+)/);
        if (!match) return;

        const ticketKey = match[1];
        console.log('Found ticket key:', ticketKey);

        // 检查是否已存在显示元素
        let keyDisplay = document.getElementById('floating-ticket-key');
        if (keyDisplay) {
            // 找到链接元素并更新其内容
            const linkElement = keyDisplay.querySelector('a');
            if (linkElement) {
                linkElement.textContent = ticketKey;
                linkElement.href = `/browse/${ticketKey}`;
            }
        } else {
            // 创建新的显示元素
            keyDisplay = createTicketKeyDisplay(ticketKey);
            document.body.appendChild(keyDisplay);
        }
    } catch (error) {
        console.log('显示ticket key时出错:', error);
    }
}

// 将checkAndDisplayTicketKey添加到现有的URL监听中
const debouncedDisplayKey = debounce(checkAndDisplayTicketKey, 1000);

// 修改现有的URL监听器
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        console.log('URL changed to', url);
        setTimeout(() => {
            debouncedCheck();
            debouncedDisplayKey();
        }, 3000);
    }
}).observe(document, {subtree: true, childList: true});

// 在页面加载完成后执行
window.addEventListener('load', () => {
    console.log('页面加载完成，准备检查...');
    setTimeout(() => {
        debouncedCheck();
        debouncedDisplayKey();
    }, 3000);
});

// 初始检查
console.log('初始化检查...');
setTimeout(() => {
    debouncedCheck();
    debouncedDisplayKey();
}, 3000);
  