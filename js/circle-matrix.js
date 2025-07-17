class CircleMatrix {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`容器元素 ${containerId} 未找到`);
            return;
        }
        
        // 默认配置
        this.config = {
            rows: options.rows || 3,
            circlesPerRow: options.circlesPerRow || [5, 4, 5], // 每行圆圈数量
            circleSize: options.circleSize || 30,
            showIndices: options.showIndices !== undefined ? options.showIndices : true,
            indices: options.indices || null, // 自定义索引数组
            disabledIndices: options.disabledIndices || [], // 未使用的圆圈索引
            selectedIndices: options.selectedIndices || [], // 初始选中的圆圈索引
            colors: {
                selected: options.colors?.selected || '#4CAF50', // 选中状态颜色
                unselected: options.colors?.unselected || '#2196F3', // 未选中状态颜色
                disabled: options.colors?.disabled || '#e0e0e0' // 未使用状态颜色
            }
        };
        
        // 存储所有圆圈元素
        this.circles = [];
        // 存储每行的圆圈数量
        this.rowsConfig = [...this.config.circlesPerRow];
        // 索引到圆圈的映射
        this.indexMap = new Map();
        // 存储所有圆圈的状态
        this.circleStates = new Map();
        
        // 初始化
        this.init();
        
        // 绑定事件
        this.bindEvents();
    }
    
    init() {
        this.container.innerHTML = '';
        this.circles = [];
        this.indexMap.clear();
        this.circleStates.clear();
        
        // 如果没有提供自定义索引，则使用行列号作为默认索引
        if (!this.config.indices) {
            this.config.indices = [];
            for (let row = 0; row < this.config.rows; row++) {
                const rowIndices = [];
                const circlesInRow = this.rowsConfig[row] || 4;
                for (let col = 0; col < circlesInRow; col++) {
                    rowIndices.push(`${row}_${col}`);
                }
                this.config.indices.push(rowIndices);
            }
        }
        
        // 创建行和圆圈
        for (let row = 0; row < this.config.rows; row++) {
            const rowElement = document.createElement('div');
            rowElement.className = 'circle-row';
            rowElement.dataset.row = row;
            
            // 获取当前行的圆圈数量和索引
            const circlesInRow = this.rowsConfig[row] || 4;
            const rowIndices = this.config.indices[row] || [];
            
            for (let col = 0; col < circlesInRow; col++) {
                const circle = document.createElement('div');
                circle.className = 'circle';
                circle.dataset.row = row;
                circle.dataset.col = col;
                
                // 获取自定义索引，如果没有则使用行列号
                const index = rowIndices[col] || `${row}_${col}`;
                circle.dataset.index = index;
                
                // 设置圆圈样式
                circle.style.width = `${this.config.circleSize}px`;
                circle.style.height = `${this.config.circleSize}px`;
                
                // 添加索引显示
                if (this.config.showIndices) {
                    const indexLabel = document.createElement('span');
                    indexLabel.className = 'circle-index';
                    indexLabel.textContent = index;
                    circle.appendChild(indexLabel);
                }
                
                // 初始化圆圈状态
                let state;
                if (this.config.disabledIndices.includes(index)) {
                    state = 'disabled';
                    circle.classList.add('disabled');
                    circle.style.cursor = 'not-allowed';
                } else if (this.config.selectedIndices.includes(index)) {
                    state = 'selected';
                    circle.classList.add('selected');
                } else {
                    state = 'unselected';
                    circle.classList.add('unselected');
                }
                
                // 设置初始颜色
                this.updateCircleAppearance(circle, state);
                
                // 存储状态
                this.circleStates.set(index, state);
                
                rowElement.appendChild(circle);
                this.circles.push(circle);
                this.indexMap.set(index, { element: circle, row, col });
            }
            
            this.container.appendChild(rowElement);
        }
    }
    
    updateCircleAppearance(circle, state) {
        console.log(state)
        switch (state) {
            case 'selected':
                circle.style.backgroundColor = this.config.colors.selected;
                break;
            case 'unselected':
                circle.style.backgroundColor = this.config.colors.unselected;
                break;
            case 'disabled':
                circle.style.backgroundColor = this.config.colors.disabled;
                break;
        }
    }
    
    bindEvents() {
        // 为每个圆圈添加点击事件
        this.circles.forEach(circle => {
            circle.addEventListener('click', () => {
                console.log('clicked');
                const index = circle.dataset.index;
                const currentState = this.circleStates.get(index);
                
                // 如果圆圈是禁用状态，则不处理点击
                if (currentState === 'disabled') return;
                
                // 切换状态
                let newState;
                if (currentState === 'selected') {
                    newState = 'unselected';
                    circle.classList.remove('selected');
                    circle.classList.add('unselected');
                } else {
                    newState = 'selected';
                    circle.classList.remove('unselected');
                    circle.classList.add('selected');
                }
                
                // 更新状态和外观
                this.circleStates.set(index, newState);
                this.updateCircleAppearance(circle, newState);
                
                // 触发自定义事件
                const row = parseInt(circle.dataset.row);
                const col = parseInt(circle.dataset.col);
                this.dispatchEvent('circleStateChange', { 
                    row, 
                    col, 
                    index, 
                    element: circle, 
                    state: newState,
                    previousState: currentState
                });
            });
            
            // 悬停效果只对非禁用圆圈有效
            circle.addEventListener('mouseover', () => {
                const index = circle.dataset.index;
                console.log('mouseover');
                if (this.circleStates.get(index) !== 'disabled') {
                    circle.style.transform = 'scale(1.1)';
                    circle.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                }
            });
            
            circle.addEventListener('mouseout', () => {
                circle.style.transform = '';
                circle.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
            });
        });
    }
    
    // 通过索引获取圆圈元素
    getCircleByIndex(index) {
        const entry = this.indexMap.get(index);
        return entry ? entry.element : null;
    }
    
    // 通过索引获取圆圈的位置信息
    getCirclePositionByIndex(index) {
        const entry = this.indexMap.get(index);
        return entry ? { row: entry.row, col: entry.col } : null;
    }
    
    // 获取圆圈状态
    getCircleState(index) {
        return this.circleStates.get(index) || null;
    }
    
    // 设置圆圈状态
    setCircleState(index, state) {
        const circle = this.getCircleByIndex(index);
        if (!circle) return false;
        
        const currentState = this.circleStates.get(index);
        if (currentState === state) return true;
        
        // 验证状态是否有效
        if (!['selected', 'unselected', 'disabled'].includes(state)) {
            console.error(`无效的状态: ${state}`);
            return false;
        }
        
        // 更新状态
        this.circleStates.set(index, state);
        
        // 更新类名
        circle.classList.remove('selected', 'unselected', 'disabled');
        circle.classList.add(state);
        
        // 更新外观
        this.updateCircleAppearance(circle, state);
        
        // 如果是禁用状态，设置不可交互
        if (state === 'disabled') {
            circle.style.cursor = 'not-allowed';
        } else {
            circle.style.cursor = 'pointer';
        }
        
        return true;
    }
    
    // 切换圆圈状态
    toggleCircleState(index) {
        const currentState = this.circleStates.get(index);
        if (!currentState || currentState === 'disabled') return false;
        
        const newState = currentState === 'selected' ? 'unselected' : 'selected';
        return this.setCircleState(index, newState);
    }
    
    // 获取所有选中状态的圆圈索引
    getSelectedIndices() {
        const selected = [];
        for (const [index, state] of this.circleStates) {
            if (state === 'selected') selected.push(index);
        }
        return selected;
    }
    
    // 获取所有未选中状态的圆圈索引
    getUnselectedIndices() {
        const unselected = [];
        for (const [index, state] of this.circleStates) {
            if (state === 'unselected') unselected.push(index);
        }
        return unselected;
    }
    
    // 获取所有禁用状态的圆圈索引
    getDisabledIndices() {
        const disabled = [];
        for (const [index, state] of this.circleStates) {
            if (state === 'disabled') disabled.push(index);
        }
        return disabled;
    }
    
    // 获取特定圆圈元素（通过行列号）
    getCircleElement(row, col) {
        return this.container.querySelector(`.circle[data-row="${row}"][data-col="${col}"]`);
    }
    
    // 添加新行
    addRow(circlesCount = 4, indices = [], disabledIndices = []) {
        this.config.rows++;
        this.rowsConfig.push(circlesCount);
        if (this.config.indices) {
            this.config.indices.push(indices);
        }
        if (disabledIndices.length > 0) {
            this.config.disabledIndices.push(...disabledIndices);
        }
        this.init(); // 重新初始化
    }
    
    // 自定义事件分发
    dispatchEvent(eventName, detail) {
        const event = new CustomEvent(eventName, { detail });
        this.container.dispatchEvent(event);
    }
    
    // 添加事件监听
    on(eventName, callback) {
        this.container.addEventListener(eventName, (e) => callback(e.detail));
    }
}