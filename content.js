// 创建一个函数来等待元素出现
function waitForElement(selector, maxAttempts = 20) {
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
            
            setTimeout(checkElement, 500);
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

// 创建一个函数来检查Epic Link
async function checkEpicLink() {
    try {
        console.log('开始检查...');
        
        // 先检查URL
        if (!window.location.href.includes('/browse/')) {
            console.log('不是Jira ticket页面，跳过检查');
            return;
        }

        console.log('开始检查Epic Link...');
        
        // 等待页面加载完成
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 获取所有字段列表项
        const fields = document.querySelectorAll('li.item');
        console.log('找到字段数量:', fields.length);
        
        // 查找Epic Link字段
        let epicLinkField = null;
        fields.forEach(field => {
            const label = field.querySelector('strong.name');
            if (label) {
                console.log('字段标签:', label.textContent);
                if (label.textContent.trim() === 'Epic Link') {
                    epicLinkField = field;
                }
            }
        });
        
        console.log('Epic Link字段:', epicLinkField);
        
        // 如果没有Epic Link或Epic Link为空，添加警告
        if (!epicLinkField || !epicLinkField.querySelector('.value')?.textContent.trim()) {
            console.log('未找到Epic Link或Epic Link为空，准备添加警告...');
            
            // 尝试找到标题元素
            const titleElement = document.querySelector('#summary-val');
            
            console.log('标题元素:', titleElement);
            
            if (titleElement && !document.getElementById('epic-link-warning')) {
                // 创建一个容器元素
                const containerDiv = document.createElement('div');
                containerDiv.style.cssText = `
                    display: block;
                    width: 100%;
                    margin-top: 4px;
                `;

                // 创建警告元素
                const warningElement = document.createElement('div');
                warningElement.id = 'epic-link-warning';
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
                    gap: 6px;  /* 添加图标和文本之间的间距 */
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
                textSpan.textContent = 'NO EPIC LINK';

                // 将图标和文本添加到警告元素中
                warningElement.appendChild(iconSvg);
                warningElement.appendChild(textSpan);

                // 将警告元素添加到容器中
                containerDiv.appendChild(warningElement);

                // 将容器插入到标题元素后面
                titleElement.parentNode.insertBefore(containerDiv, titleElement.nextSibling);

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

                // 添加按下效果
                warningElement.addEventListener('mousedown', () => {
                    warningElement.style.transform = 'translateY(0)';
                    warningElement.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                });

                warningElement.addEventListener('mouseup', () => {
                    warningElement.style.transform = 'translateY(-1px)';
                    warningElement.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                });

                // 添加点击事件
                warningElement.addEventListener('click', handleNoEpicLinkClick);
                
                console.log('警告元素已添加到标题下方');
            } else {
                console.log('未找到标题元素或警告已存在');
            }
        } else {
            // 如果找到Epic Link且有值，移除已存在的警告
            const existingWarning = document.getElementById('epic-link-warning');
            if (existingWarning) {
                existingWarning.remove();
                console.log('移除已存在的警告');
            }
        }
    } catch (error) {
        console.log('检查过程中出错:', error);
    }
}

// 处理NO EPIC LINK点击事件
function handleNoEpicLinkClick(event) {
    // 防止事件冒泡
    event.preventDefault();
    event.stopPropagation();
    
    console.log('NO EPIC LINK clicked');
    
    // 使用正确的选择器查找Edit按钮
    const editButton = 
        document.querySelector('#edit-issue') || // 使用ID选择器
        document.querySelector('button[id="edit-issue"]') || // 备选方案1
        document.querySelector('button[aria-label="Edit issue"]'); // 备选方案2
    
    console.log('Found edit button:', editButton);
    
    if (editButton) {
        console.log('Clicking edit button');
        editButton.click();
        
        // 等待编辑界面加载完成并滚动到Epic Link字段
        waitForElement('#customfield_11450-field', 20)
            .then(epicLinkField => {
                console.log('Epic Link field found:', epicLinkField);
                epicLinkField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                epicLinkField.focus();
                
                // 打开下拉菜单
                const dropdownButton = epicLinkField.querySelector('button[aria-haspopup="listbox"]');
                if (dropdownButton) {
                    dropdownButton.click();
                }
            })
            .catch(error => {
                console.error('Error finding Epic Link field:', error);
            });
    } else {
        console.log('Edit button not found');
        // 如果找不到按钮，尝试通过URL打开编辑页面
        const currentUrl = window.location.href;
        const issueKey = currentUrl.split('/browse/')[1]?.split(/[?#]/)[0];
        if (issueKey) {
            console.log('Navigating to edit page for issue:', issueKey);
            window.location.href = `/secure/EditIssue!default.jspa?id=${issueKey}`;
        }
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

// 监听URL变化
let lastUrl = location.href;
new MutationObserver((mutations) => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        console.log('URL changed to', url);
        setTimeout(debouncedCheck, 3000);
    }
}).observe(document, {subtree: true, childList: true});

// 页面加载完成后执行检查
window.addEventListener('load', () => {
    console.log('页面加载完成，准备检查...');
    setTimeout(debouncedCheck, 3000);
});

// 初始检查
console.log('初始化检查...');
setTimeout(debouncedCheck, 3000);
  