import { _decorator, Component, EventTouch, Node, Quat, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ModelRotate')
export class ModelRotate extends Component {
    @property({
        type: Node,
        tooltip: '触摸控制面板'
    })
    touchPanel: Node = null;

    @property({
        type: Node,
        tooltip: '要旋转的3D模型'
    })
    model: Node = null;    
    
    @property({
        tooltip: '旋转灵敏度',
        range: [0.001, 0.01, 0.001]
    })
    rotationSensitivity = 0.002;

    // 复用向量和四元数对象以优化性能
    private readonly _startPoint = new Vec3();
    private readonly _movePoint = new Vec3();
    private readonly _rotationAxis = new Vec3();
    private readonly _tempQuat = new Quat();
    
    // 最小移动距离阈值，避免微小抖动
    private static readonly MOVE_THRESHOLD = 0.001;

    onLoad() {
        this._registerEvents();
    }

    onDestroy() {
        this._unregisterEvents();
    }

    private _registerEvents(): void {
        this.touchPanel.on(Node.EventType.TOUCH_START, this._onTouchStart, this);
        this.touchPanel.on(Node.EventType.TOUCH_MOVE, this._onTouchMove, this);
    }

    private _unregisterEvents(): void {
        this.touchPanel.off(Node.EventType.TOUCH_START, this._onTouchStart, this);
        this.touchPanel.off(Node.EventType.TOUCH_MOVE, this._onTouchMove, this);
    }

    private _onTouchStart(event: EventTouch): void {
        const location = event.getUILocation();
        this._startPoint.set(location.x, location.y, 0);
    }

    private _onTouchMove(event: EventTouch): void {
        const location = event.getUILocation();
        this._movePoint.set(location.x, location.y, 0);
        
        // 计算移动距离
        const deltaX = this._movePoint.x - this._startPoint.x;
        const deltaY = this._movePoint.y - this._startPoint.y;
        
        // 检查是否达到最小移动阈值
        if (Math.abs(deltaX) > ModelRotate.MOVE_THRESHOLD || 
            Math.abs(deltaY) > ModelRotate.MOVE_THRESHOLD) {
            
            // 计算移动距离和旋转角度
            const moveDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const rotationAngle = moveDistance * this.rotationSensitivity;
            
            // 设置旋转轴（垂直于移动方向）
            this._rotationAxis.set(-deltaY, deltaX, 0);
            this._rotationAxis.normalize();
            
            // 计算旋转四元数
            Quat.fromAxisAngle(this._tempQuat, this._rotationAxis, rotationAngle);
            
            // 将新的旋转与当前旋转结合 左乘以世界坐标轴旋转 右乘以本地坐标轴旋转
            Quat.multiply(this._tempQuat, this._tempQuat, this.model.rotation);
            
            // 应用旋转
            this.model.setRotation(this._tempQuat);
        }
        
        // 更新起始点
        this._startPoint.set(this._movePoint);
    }
}

