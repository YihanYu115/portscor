const components = {
    chip1: null,
    chip2: null,
    rf1: null,
    rf2: null,
    rf3: null
};

// 连接关系映射表
const connectionMap = {
    chipToRf: new Map(),  // 芯片到射频的映射
    rfToChip: new Map()   // 射频到芯片的映射
};

// 初始化所有组件
function initComponents() {
    // 获取配置
    const chip1Config = parseConfig(document.getElementById('chip1Config').value);
    const chip2Config = parseConfig(document.getElementById('chip2Config').value);
    const rf1Config = parseConfig(document.getElementById('rf1Config').value);
    const rf2Config = parseConfig(document.getElementById('rf2Config').value);
    const rf3Config = parseConfig(document.getElementById('rf3Config').value);

    let chip1Indices, chip2Indices, rf1Indices, rf2Indices, rf3Indices;
    
    try {
        chip1Indices = parseIndices(document.getElementById('chip1Indices').value);
    } catch (e) {
        showStatus('芯片1索引格式错误: ' + e.message, 'error');
        return;
    }
    
    try {
        chip2Indices = parseIndices(document.getElementById('chip2Indices').value);
    } catch (e) {
        showStatus('芯片2索引格式错误: ' + e.message, 'error');
        return;
    }
    
    try {
        rf1Indices = parseIndices(document.getElementById('rf1Indices').value);
    } catch (e) {
        showStatus('射频组1索引格式错误: ' + e.message, 'error');
        return;
    }
    
    try {
        rf2Indices = parseIndices(document.getElementById('rf2Indices').value);
    } catch (e) {
        showStatus('射频组2索引格式错误: ' + e.message, 'error');
        return;
    }
    
    try {
        rf3Indices = parseIndices(document.getElementById('rf3Indices').value);
    } catch (e) {
        showStatus('射频组3索引格式错误: ' + e.message, 'error');
        return;
    }
    
    // 初始化芯片1
    components.chip1 = new CircleMatrix('chip1', {
        rows: chip1Config.rows,
        circlesPerRow: chip1Config.circlesPerRow,
        indices: chip1Indices,
        colors: {
            selected: '#4CAF50',
            unselected: '#2196F3',
            disabled: '#e0e0e0',
        }
    });
    
    // 初始化芯片2
    components.chip2 = new CircleMatrix('chip2', {
        rows: chip2Config.rows,
        circlesPerRow: chip2Config.circlesPerRow,
        indices: chip2Indices,
        colors: {
            selected: '#4CAF50',
            unselected: '#2196F3',
            disabled: '#e0e0e0'
        }
    });
    
    // 初始化射频组1
    components.rf1 = new CircleMatrix('rf1', {
        rows: rf1Config.rows,
        circlesPerRow: rf1Config.circlesPerRow,
        indices: rf1Indices,
        colors: {
            selected: '#FF9800',
            unselected: '#9C27B0',
            disabled: '#e0e0e0'
        }
    });
    
    // 初始化射频组2
    components.rf2 = new CircleMatrix('rf2', {
        rows: rf2Config.rows,
        circlesPerRow: rf2Config.circlesPerRow,
        indices: rf2Indices,
        colors: {
            selected: '#FF9800',
            unselected: '#9C27B0',
            disabled: '#e0e0e0'
        }
    });
    
    // 初始化射频组3
    components.rf3 = new CircleMatrix('rf3', {
        rows: rf3Config.rows,
        circlesPerRow: rf3Config.circlesPerRow,
        indices: rf3Indices,
        colors: {
            selected: '#FF9800',
            unselected: '#9C27B0',
            disabled: '#e0e0e0'
        }
    });
    
    // 应用初始连接关系
    applyConnections();
    
    // 添加点击事件监听
    setupConnectionHandlers();
}

// 解析配置字符串 (格式: "行数,每行圆圈数 每行圆圈数...")
function parseConfig(configStr) {
    const parts = configStr.split(',');
    const rows = parseInt(parts[0]);
    const circlesPerRow = parts[1].trim().split(' ').map(num => parseInt(num));
    return { rows, circlesPerRow };
}

function parseIndices(input) {
    if (!input || input.trim() === '') return null;
    
    const parsed = JSON.parse(input);
    if (!Array.isArray(parsed)) {
        throw new Error('必须是数组格式');
    }
    
    // 递归地将所有索引值转换为字符串
    const convertToString = (arr) => {
        return arr.map(item => {
            if (Array.isArray(item)) {
                return convertToString(item);
            }
            return item !== null && item !== undefined ? String(item) : '';
        });
    };
    
    return convertToString(parsed);
}

// 解析连接关系并建立映射
function parseConnections(connectionText) {
    // 清空现有映射
    connectionMap.chipToRf.clear();
    connectionMap.rfToChip.clear();
    
    const lines = connectionText.split('\n');
    const errors = [];
    const usedChipPorts = new Set();
    const usedRfPorts = new Set();
    
    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        // 解析格式: 芯片编号:端口索引=射频组编号:端口索引
        const match = trimmedLine.match(/^(\d):(.+)=(\d):(.+)$/);
        if (!match) {
            errors.push(`无效的连接格式: ${line}`);
            continue;
        }
        
        const chipNum = match[1];
        const chipPort = match[2];
        const rfGroupNum = match[3];
        const rfPort = match[4];
        
        // 检查芯片编号是否有效
        if (chipNum !== '1' && chipNum !== '2') {
            errors.push(`无效的芯片编号: ${chipNum} (必须是1或2)`);
            continue;
        }
        
        // 检查射频组编号是否有效
        if (rfGroupNum !== '1' && rfGroupNum !== '2' && rfGroupNum !== '3') {
            errors.push(`无效的射频组编号: ${rfGroupNum} (必须是1、2或3)`);
            continue;
        }
        
        // 检查端口是否重复
        const chipKey = `${chipNum}:${chipPort}`;
        if (usedChipPorts.has(chipKey)) {
            errors.push(`芯片端口重复: ${chipKey}`);
            continue;
        }
        
        const rfKey = `${rfGroupNum}:${rfPort}`;
        if (usedRfPorts.has(rfKey)) {
            errors.push(`射频端口重复: ${rfKey}`);
            continue;
        }
        
        // 添加到映射表
        connectionMap.chipToRf.set(chipKey, rfKey);
        connectionMap.rfToChip.set(rfKey, chipKey);
        usedChipPorts.add(chipKey);
        usedRfPorts.add(rfKey);
    }
    
    return errors;
}

// 应用连接关系并更新组件状态
function applyConnections() {
    const connectionText = document.getElementById('connections').value;
    const errors = parseConnections(connectionText);
    
    if (errors.length > 0) {
        showStatus(errors.join('<br>'), 'error');
        return false;
    }
    
    // 获取所有组件中所有可能的端口
    const allPorts = getAllPorts();
    
    // 首先禁用所有端口
    disableAllPorts();
    
    // 然后根据连接关系启用相关端口
    for (const [chipKey, rfKey] of connectionMap.chipToRf) {
        const [chipNum, chipPort] = chipKey.split(':');
        const [rfGroupNum, rfPort] = rfKey.split(':');
        
        // 获取对应的组件
        const chipComponent = components[`chip${chipNum}`];
        const rfComponent = components[`rf${rfGroupNum}`];
        
        // 检查端口是否存在
        if (!chipComponent || !chipComponent.getCircleByIndex(chipPort)) {
            errors.push(`芯片${chipNum}的端口${chipPort}不存在`);
            continue;
        }
        
        if (!rfComponent || !rfComponent.getCircleByIndex(rfPort)) {
            errors.push(`射频组${rfGroupNum}的端口${rfPort}不存在`);
            continue;
        }
        
        // 启用这些端口
        chipComponent.setCircleState(chipPort, 'unselected');
        rfComponent.setCircleState(rfPort, 'unselected');
        
        // 从所有端口中移除这些端口，表示它们已被处理
        allPorts.chip.delete(chipKey);
        allPorts.rf.delete(rfKey);
    }
    
    // 剩下的端口在连接关系中未出现，保持禁用状态
    for (const chipKey of allPorts.chip) {
        const [chipNum, chipPort] = chipKey.split(':');
        const chipComponent = components[`chip${chipNum}`];
        if (chipComponent) {
            chipComponent.setCircleState(chipPort, 'disabled');
        }
    }
    
    for (const rfKey of allPorts.rf) {
        const [rfGroupNum, rfPort] = rfKey.split(':');
        const rfComponent = components[`rf${rfGroupNum}`];
        if (rfComponent) {
            rfComponent.setCircleState(rfPort, 'disabled');
        }
    }
    
    if (errors.length > 0) {
        showStatus(errors.join('<br>'), 'error');
        return false;
    }
    
    showStatus('连接关系应用成功', 'success');
    return true;
}

// 获取所有组件中的所有端口
function getAllPorts() {
    const result = {
        chip: new Set(),
        rf: new Set()
    };
    
    // 收集芯片端口
    for (const chipNum of ['1', '2']) {
        const component = components[`chip${chipNum}`];
        if (!component) continue;
        
        const selected = component.getSelectedIndices();
        const unselected = component.getUnselectedIndices();
        const disabled = component.getDisabledIndices();
        
        for (const index of [...selected, ...unselected, ...disabled]) {
            result.chip.add(`${chipNum}:${index}`);
        }
    }
    
    // 收集射频端口
    for (const rfGroupNum of ['1', '2', '3']) {
        const component = components[`rf${rfGroupNum}`];
        if (!component) continue;
        
        const selected = component.getSelectedIndices();
        const unselected = component.getUnselectedIndices();
        const disabled = component.getDisabledIndices();
        
        for (const index of [...selected, ...unselected, ...disabled]) {
            result.rf.add(`${rfGroupNum}:${index}`);
        }
    }
    
    return result;
}

// 禁用所有端口
function disableAllPorts() {
    for (const chipNum of ['1', '2']) {
        const component = components[`chip${chipNum}`];
        if (!component) continue;
        
        const allIndices = [
            ...component.getSelectedIndices(),
            ...component.getUnselectedIndices(),
            ...component.getDisabledIndices()
        ];
        
        for (const index of allIndices) {
            component.setCircleState(index, 'disabled');
        }
    }
    
    for (const rfGroupNum of ['1', '2', '3']) {
        const component = components[`rf${rfGroupNum}`];
        if (!component) continue;
        
        const allIndices = [
            ...component.getSelectedIndices(),
            ...component.getUnselectedIndices(),
            ...component.getDisabledIndices()
        ];
        
        for (const index of allIndices) {
            component.setCircleState(index, 'disabled');
        }
    }
}

// 设置连接处理程序
function setupConnectionHandlers() {
    // 为所有芯片和射频组件添加点击事件处理
    for (const chipNum of ['1', '2']) {
        const component = components[`chip${chipNum}`];
        if (!component) continue;
        
        component.on('circleStateChange', (detail) => {
            if (detail.state === 'disabled') return;
            
            const chipKey = `${chipNum}:${detail.index}`;
            const rfKey = connectionMap.chipToRf.get(chipKey);
            
            if (rfKey) {
                const [rfGroupNum, rfPort] = rfKey.split(':');
                const rfComponent = components[`rf${rfGroupNum}`];
                if (rfComponent) {
                    rfComponent.setCircleState(rfPort, detail.state);
                }
            }
        });
    }
    
    for (const rfGroupNum of ['1', '2', '3']) {
        const component = components[`rf${rfGroupNum}`];
        if (!component) continue;
        
        component.on('circleStateChange', (detail) => {
            if (detail.state === 'disabled') return;
            
            const rfKey = `${rfGroupNum}:${detail.index}`;
            const chipKey = connectionMap.rfToChip.get(rfKey);
            
            if (chipKey) {
                const [chipNum, chipPort] = chipKey.split(':');
                const chipComponent = components[`chip${chipNum}`];
                if (chipComponent) {
                    chipComponent.setCircleState(chipPort, detail.state);
                }
            }
        });
    }
}

// 显示状态消息
function showStatus(message, type) {
    const statusDiv = document.getElementById('status');
    statusDiv.innerHTML = message;
    statusDiv.className = `status ${type}`;
}

// 初始化按钮事件
document.getElementById('initBtn').addEventListener('click', () => {
    initComponents();
});

// 应用连接关系按钮事件
document.getElementById('applyConnectionsBtn').addEventListener('click', () => {
    applyConnections();
});

// 页面加载时初始化
window.addEventListener('load', () => {
    initComponents();
});

document.addEventListener('DOMContentLoaded', function() {
    const toggleChip1Container = document.getElementById('toggleChip1Container');
    const chip1Section = document.getElementById('chip1Section');
    
    toggleChip1Container.addEventListener('change', function() {
        if(this.checked) {
            chip1Section.style.display = 'block';
        } else {
            chip1Section.style.display = 'none';
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const toggleChip2Container = document.getElementById('toggleChip2Container');
    const chip2Section = document.getElementById('chip2Section');
    
    toggleChip2Container.addEventListener('change', function() {
        if(this.checked) {
            chip2Section.style.display = 'block';
        } else {
            chip2Section.style.display = 'none';
        }
    });
});