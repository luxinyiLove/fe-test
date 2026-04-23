'use client';

import { useState } from 'react';
import {
  DndContext, // 将组件包裹后，使得组件支持拖拽，数据可以共享
  closestCenter, // 拖拽时，会自动寻找最接近的元素
  PointerSensor, // 鼠标或者在手机上移动，可以触发拖拽
  useSensor, // 拖拽的触发方式比如鼠标或者触摸拖拽
  useSensors, // 把触发方式打包注册到 DNDKit 中
  DragEndEvent, // 拖拽结束后进行数据处理
} from '@dnd-kit/core';
import {
  arrayMove, // 通过新旧移动点，对数据进行重新排序
  SortableContext, // 注册可排序列表的容器
  horizontalListSortingStrategy, // 元素水平排序，拖拽时水平移动
  useSortable, // 用此hooks包裹的元素，可以互相拖拽换位置
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  MapIcon,
  MusicalNoteIcon,
  ChatBubbleBottomCenterIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'; // 页面上的图标，分别是地图、音乐、聊天、关闭

// 左侧 nav 数据类型
interface NavItem {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  isOpen: boolean;
}

// 右侧可排序卡片
function SortableNav({
  nav,
  onClose
}: {
  nav: NavItem;
  onClose: (id: string) => void;
}) {
  const {
    attributes,    // 给卡片添加必要的html属性，告诉浏览器这个卡片是可拖拽的
    listeners,     // 给卡片添加事件监听器，随时监听拖拽行为
    setNodeRef,    // 把卡片注册到 DNDKit 内部
    transform,     // 拖拽时的位置偏移
    transition,    // 松手后的动画过渡
    isDragging,    // 是否正在拖拽中
  } = useSortable({ id: nav.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-shrink-0 w-[300px] h-full bg-white flex flex-col border-r-2 border-gray-100"
    >
      {/* 可拖拽头部 */}
      <div
        className="p-1 flex items-center justify-between cursor-grab active:cursor-grabbing bg-gray-50"
        {...attributes}
        {...listeners}
      >
        <div className="w-8"></div>
        <h5 className="font-medium text-gray-800">{nav.title}</h5>
        <button
          onClick={() => onClose(nav.id)}
          className="p-1 rounded hover:bg-gray-200 transition-colors"
        >
          <XMarkIcon className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      {/* 这里是卡片内容 */}
      <div className="flex-1 p-4">
        <p className="text-gray-500 text-sm text-center"></p>
      </div>
    </div>
  );
}

// 左侧导航按钮
function NavButton({
  nav,
  onSwitch
}: {
  nav: NavItem;
  onSwitch: (id: string) => void;
}) {
  const Icon = nav.icon;

  return (
    <button
      onClick={() => onSwitch(nav.id)}
      className={`flex flex-col items-center gap-1 p-1 transition-all duration-200 group`}
    >
      <Icon className={`w-6 h-6 transition-all ${nav.isOpen ? 'text-gray-900' : 'text-gray-300  group-hover:text-gray-600'}`} />
      <span className={`text-xs font-medium ${nav.isOpen ? 'text-gray-900' : 'text-gray-300  group-hover:text-gray-600'}`}>
        {nav.title}
      </span>
    </button>
  );
}

export default function Home() {
  // 初始nav数据
  const [navs, setNavs] = useState<NavItem[]>([
    { id: 'map', title: 'Map', icon: MapIcon, isOpen: true },
    { id: 'music', title: 'Music', icon: MusicalNoteIcon, isOpen: true },
    { id: 'chat', title: 'Chat', icon: ChatBubbleBottomCenterIcon, isOpen: true },
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }, // 鼠标移动超过 8px时激活移动，activationConstraint 激活拖拽的约束条件
    }),
  );

  // 拖拽结束处理
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setNavs((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // 左侧nav切换
  const switchNav = (navId: string) => {
    setNavs((prev) =>
      prev.map((current) =>
        current.id === navId ? { ...current, isOpen: !current.isOpen } : current
      )
    );
  };

  // 右侧卡片关闭
  const closeNav = (navId: string) => {
    setNavs((prev) =>
      prev.map((nav) =>
        nav.id === navId ? { ...nav, isOpen: false } : nav
      )
    );
  };

  const openNavs = navs.filter((p) => p.isOpen);

  return (
    <div className="h-screen flex">
      {/* 左侧固定导航栏 */}
      <aside className="h-full w-24 border-r-2 border-gray-100 z-20 flex flex-col gap-2 py-6 flex-shrink-0 ">
        {/* 按钮列表 */}
        {navs.map((nav) => (
          <NavButton
            key={nav.id}
            nav={nav}
            onSwitch={switchNav}
          />
        ))}
      </aside>

      {/* 右侧主内容区*/}
      <main className="overflow-hidden flex-1">
        <div className="h-full overflow-x-auto overflow-y-hidden">
          <div className="h-full flex">
            {openNavs.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={openNavs.map((p) => p.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  <div className="flex items-start">
                    {openNavs.map((nav) => (
                      <SortableNav
                        key={nav.id}
                        nav={nav}
                        onClose={closeNav}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="w-full flex justify-center items-center">
                <p className="text-gray-500">所有卡片已关闭，点击左侧按钮打开</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}